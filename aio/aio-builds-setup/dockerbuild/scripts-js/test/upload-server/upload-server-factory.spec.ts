// Imports
import * as express from 'express';
import * as http from 'http';
import * as supertest from 'supertest';
import {promisify} from 'util';
import {CircleCiApi} from '../../lib/common/circle-ci-api';
import {GithubApi} from '../../lib/common/github-api';
import {GithubPullRequests} from '../../lib/common/github-pull-requests';
import {GithubTeams} from '../../lib/common/github-teams';
import {BuildCreator} from '../../lib/upload-server/build-creator';
import {ChangedPrVisibilityEvent, CreatedBuildEvent} from '../../lib/upload-server/build-events';
import {BuildRetriever, GithubInfo} from '../../lib/upload-server/build-retriever';
import {BuildVerifier} from '../../lib/upload-server/build-verifier';
import {UploadServerConfig, UploadServerFactory} from '../../lib/upload-server/upload-server-factory';

interface CircleCiWebHookPayload {
  payload: {
    build_num: number;
    build_parameters: {
      CIRCLE_JOB: string;
    }
  };
}

// Tests
describe('uploadServerFactory', () => {
  const defaultConfig: UploadServerConfig = {
    buildArtifactPath: 'artifact/path.zip',
    buildsDir: 'builds/dir',
    circleCiToken: 'CIRCLE_CI_TOKEN',
    domainName: 'domain.name',
    downloadSizeLimit: 999,
    downloadsDir: '/tmp/aio-create-builds',
    githubOrg: 'organisation',
    githubRepo: 'repo',
    githubTeamSlugs: ['team1', 'team2'],
    githubToken: '12345',
    significantFilesPattern: '^(?:aio|packages)\\/(?!.*[._]spec\\.[jt]s$)',
    trustedPrLabel: 'trusted: pr-label',
  };

  // Helpers
  const createUploadServer = (partialConfig: Partial<UploadServerConfig> = {}) =>
    UploadServerFactory.create({...defaultConfig, ...partialConfig});

  beforeEach(() => {
    spyOn(console, 'error');
    spyOn(console, 'info');
    spyOn(console, 'log');
  });

  describe('create()', () => {
    let usfCreateMiddlewareSpy: jasmine.Spy;

    beforeEach(() => {
      usfCreateMiddlewareSpy = spyOn(UploadServerFactory, 'createMiddleware').and.callThrough();
    });


    it('should throw if \'buildsDir\' is missing or empty', () => {
      expect(() => createUploadServer({buildsDir: ''})).
        toThrowError('Missing or empty required parameter \'buildsDir\'!');
    });


    it('should throw if \'domainName\' is missing or empty', () => {
      expect(() => createUploadServer({domainName: ''})).
        toThrowError('Missing or empty required parameter \'domainName\'!');
    });


    it('should throw if \'githubToken\' is missing or empty', () => {
      expect(() => createUploadServer({githubToken: ''})).
        toThrowError('Missing or empty required parameter \'githubToken\'!');
    });


    it('should throw if \'githubOrg\' is missing or empty', () => {
      expect(() => createUploadServer({githubOrg: ''})).
        toThrowError('Missing or empty required parameter \'githubOrg\'!');
    });


    it('should throw if \'githubTeamSlugs\' is missing or empty', () => {
      expect(() => createUploadServer({githubTeamSlugs: []})).
        toThrowError('Missing or empty required parameter \'allowedTeamSlugs\'!');
    });


    it('should throw if \'githubRepo\' is missing or empty', () => {
      expect(() => createUploadServer({githubRepo: ''})).
        toThrowError('Missing or empty required parameter \'githubRepo\'!');
    });


    it('should throw if \'trustedPrLabel\' is missing or empty', () => {
      expect(() => createUploadServer({trustedPrLabel: ''})).
        toThrowError('Missing or empty required parameter \'trustedPrLabel\'!');
    });


    it('should return an http.Server', () => {
      const httpCreateServerSpy = spyOn(http, 'createServer').and.callThrough();
      const server = createUploadServer();

      expect(server).toBe(httpCreateServerSpy.calls.mostRecent().returnValue);
    });


    it('should create and use an appropriate BuildCreator', () => {
      const usfCreateBuildCreatorSpy = spyOn(UploadServerFactory, 'createBuildCreator').and.callThrough();

      createUploadServer();
      const buildRetriever = jasmine.any(BuildRetriever);
      const buildVerifier = jasmine.any(BuildVerifier);
      const prs = jasmine.any(GithubPullRequests);
      const buildCreator: BuildCreator = usfCreateBuildCreatorSpy.calls.mostRecent().returnValue;

      expect(usfCreateMiddlewareSpy).toHaveBeenCalledWith(buildRetriever, buildVerifier, buildCreator, defaultConfig);
      expect(usfCreateBuildCreatorSpy).toHaveBeenCalledWith(prs, 'builds/dir', 'domain.name');
    });


    it('should create and use an appropriate middleware', () => {
      const httpCreateServerSpy = spyOn(http, 'createServer').and.callThrough();

      createUploadServer();

      const buildRetriever = jasmine.any(BuildRetriever);
      const buildVerifier = jasmine.any(BuildVerifier);
      const buildCreator = jasmine.any(BuildCreator);
      expect(usfCreateMiddlewareSpy).toHaveBeenCalledWith(buildRetriever, buildVerifier, buildCreator, defaultConfig);

      const middleware: express.Express = usfCreateMiddlewareSpy.calls.mostRecent().returnValue;
      expect(httpCreateServerSpy).toHaveBeenCalledWith(middleware);
    });


    it('should log the server address info on \'listening\'', () => {
      const server = createUploadServer();
      server.address = () => ({address: 'foo', family: '', port: 1337});

      expect(console.info).not.toHaveBeenCalled();

      server.emit('listening');
      expect(console.info).toHaveBeenCalledWith(
        jasmine.any(String), 'UploadServer:        ', 'Up and running (and listening on foo:1337)...');
    });

  });


  // Protected methods

  describe('createBuildCreator()', () => {
    let buildCreator: BuildCreator;

    beforeEach(() => {
      const api = new GithubApi(defaultConfig.githubToken);
      const prs = new GithubPullRequests(api, defaultConfig.githubOrg, defaultConfig.githubRepo);
      buildCreator = UploadServerFactory.createBuildCreator(prs, defaultConfig.buildsDir, defaultConfig.domainName);
    });

    it('should pass the \'buildsDir\' to the BuildCreator', () => {
      expect((buildCreator as any).buildsDir).toBe('builds/dir');
    });


    describe('on \'build.created\'', () => {
      let prsAddCommentSpy: jasmine.Spy;

      beforeEach(() => prsAddCommentSpy = spyOn(GithubPullRequests.prototype, 'addComment'));


      it('should post a comment on GitHub for public previews', () => {
        const commentBody = 'You can preview 1234567890 at https://pr42-1234567890.domain.name/.';

        buildCreator.emit(CreatedBuildEvent.type, {pr: 42, sha: '1234567890', isPublic: true});
        expect(prsAddCommentSpy).toHaveBeenCalledWith(42, commentBody);
      });


      it('should not post a comment on GitHub for non-public previews', () => {
        buildCreator.emit(CreatedBuildEvent.type, {pr: 42, sha: '1234567890', isPublic: false});
        expect(prsAddCommentSpy).not.toHaveBeenCalled();
      });

    });


    describe('on \'pr.changedVisibility\'', () => {
      let prsAddCommentSpy: jasmine.Spy;

      beforeEach(() => prsAddCommentSpy = spyOn(GithubPullRequests.prototype, 'addComment'));


      it('should post a comment on GitHub (for all SHAs) for PRs made public', () => {
        const commentBody = 'You can preview 12345 at https://pr42-12345.domain.name/.\n' +
                            'You can preview 67890 at https://pr42-67890.domain.name/.';

        buildCreator.emit(ChangedPrVisibilityEvent.type, {pr: 42, shas: ['12345', '67890'], isPublic: true});
        expect(prsAddCommentSpy).toHaveBeenCalledWith(42, commentBody);
      });


      it('should not post a comment on GitHub if no SHAs were affected', () => {
        buildCreator.emit(ChangedPrVisibilityEvent.type, {pr: 42, shas: [], isPublic: true});
        expect(prsAddCommentSpy).not.toHaveBeenCalled();
      });


      it('should not post a comment on GitHub for PRs made non-public', () => {
        buildCreator.emit(ChangedPrVisibilityEvent.type, {pr: 42, shas: ['12345', '67890'], isPublic: false});
        expect(prsAddCommentSpy).not.toHaveBeenCalled();
      });

    });


    it('should pass the correct parameters to GithubPullRequests', () => {
      const prsAddCommentSpy = spyOn(GithubPullRequests.prototype, 'addComment');

      buildCreator.emit(CreatedBuildEvent.type, {pr: 42, sha: '1234567890', isPublic: true});
      buildCreator.emit(ChangedPrVisibilityEvent.type, {pr: 42, shas: ['12345', '67890'], isPublic: true});

      const allCalls = prsAddCommentSpy.calls.all();
      const prs: GithubPullRequests = allCalls[0].object;

      expect(prsAddCommentSpy).toHaveBeenCalledTimes(2);
      expect(prs).toBe(allCalls[1].object);
      expect(prs).toEqual(jasmine.any(GithubPullRequests));
      expect(prs.repoSlug).toBe('organisation/repo');
    });

  });


  describe('createMiddleware()', () => {
    let buildRetriever: BuildRetriever;
    let buildVerifier: BuildVerifier;
    let buildCreator: BuildCreator;
    let agent: supertest.SuperTest<supertest.Test>;

    // Helpers
    const promisifyRequest = async (req: supertest.Request) => await promisify(req.end.bind(req))();
    const verifyRequests = async (reqs: supertest.Request[]) => await Promise.all(reqs.map(promisifyRequest));

    beforeEach(() => {
      const circleCiApi = new CircleCiApi(defaultConfig.githubOrg, defaultConfig.githubRepo,
                                          defaultConfig.circleCiToken);
      const githubApi = new GithubApi(defaultConfig.githubToken);
      const prs = new GithubPullRequests(githubApi, defaultConfig.githubOrg, defaultConfig.githubRepo);
      const teams = new GithubTeams(githubApi, defaultConfig.githubOrg);

      buildRetriever = new BuildRetriever(circleCiApi, defaultConfig.downloadSizeLimit, defaultConfig.downloadsDir);
      buildVerifier = new BuildVerifier(prs, teams, defaultConfig.githubTeamSlugs, defaultConfig.trustedPrLabel);
      buildCreator = new BuildCreator(defaultConfig.buildsDir);

      const middleware = UploadServerFactory.createMiddleware(buildRetriever, buildVerifier, buildCreator,
                                                              defaultConfig);
      agent = supertest.agent(middleware);
    });

    describe('GET /health-check', () => {

      it('should respond with 200', async () => {
        await verifyRequests([
          agent.get('/health-check').expect(200),
          agent.get('/health-check/').expect(200),
        ]);
      });


      it('should respond with 404 for non-GET requests', async () => {
        await verifyRequests([
          agent.put('/health-check').expect(404),
          agent.post('/health-check').expect(404),
          agent.patch('/health-check').expect(404),
          agent.delete('/health-check').expect(404),
        ]);
      });


      it('should respond with 404 if the path does not match exactly', async () => {
        await verifyRequests([
          agent.get('/health-check/foo').expect(404),
          agent.get('/health-check-foo').expect(404),
          agent.get('/health-checknfoo').expect(404),
          agent.get('/foo/health-check').expect(404),
          agent.get('/foo-health-check').expect(404),
          agent.get('/foonhealth-check').expect(404),
        ]);
      });

    });

    describe('/circle-build', () => {
      let getGithubInfoSpy: jasmine.Spy;
      let getSignificantFilesChangedSpy: jasmine.Spy;
      let downloadBuildArtifactSpy: jasmine.Spy;
      let getPrIsTrustedSpy: jasmine.Spy;
      let createBuildSpy: jasmine.Spy;
      let IS_PUBLIC: boolean;
      let BUILD_INFO: GithubInfo;
      let AFFECTS_SIGNIFICANT_FILES: boolean;
      let BASIC_PAYLOAD: CircleCiWebHookPayload;
      const URL = '/circle-build';
      const BUILD_NUM = 12345;
      const PR = 777;
      const SHA = 'COMMIT';
      const DOWNLOADED_ARTIFACT_PATH = 'downloads/777-COMMIT-build.zip';

      beforeEach(() => {
        IS_PUBLIC = true;
        BUILD_INFO  = {
          org: defaultConfig.githubOrg,
          pr: PR,
          repo: defaultConfig.githubRepo,
          sha: SHA,
          success: true,
        };
        BASIC_PAYLOAD = { payload: { build_num: BUILD_NUM, build_parameters: { CIRCLE_JOB: 'aio_preview' } } };
        AFFECTS_SIGNIFICANT_FILES = true;
        getGithubInfoSpy = spyOn(buildRetriever, 'getGithubInfo')
          .and.callFake(() => Promise.resolve(BUILD_INFO));
        getSignificantFilesChangedSpy = spyOn(buildVerifier, 'getSignificantFilesChanged')
          .and.callFake(() => Promise.resolve(AFFECTS_SIGNIFICANT_FILES));
        downloadBuildArtifactSpy = spyOn(buildRetriever, 'downloadBuildArtifact')
          .and.callFake(() => Promise.resolve(DOWNLOADED_ARTIFACT_PATH));
        getPrIsTrustedSpy = spyOn(buildVerifier, 'getPrIsTrusted')
          .and.callFake(() => Promise.resolve(IS_PUBLIC));
        createBuildSpy = spyOn(buildCreator, 'create');
      });

      it('should respond with 400 if the request body is not in the correct format', async () => {
        await Promise.all([
          agent.post(URL).expect(400),
          agent.post(URL).send().expect(400),
          agent.post(URL).send({}).expect(400),
          agent.post(URL).send({ payload: {} }).expect(400),
          agent.post(URL).send({ payload: { build_num: -1 } }).expect(400),
          agent.post(URL).send({ payload: { build_num: 4000 } }).expect(400),
          agent.post(URL).send({ payload: { build_num: 4000, build_parameters: { } } }).expect(400),
          agent.post(URL).send({ payload: { build_num: 4000, build_parameters: { CIRCLE_JOB: '' } } }).expect(400),
        ]);
      });

      it('should create a preview if everything is good and the build succeeded', async () => {
        await agent.post(URL).send(BASIC_PAYLOAD).expect(201);
        expect(getGithubInfoSpy).toHaveBeenCalledWith(BUILD_NUM);
        expect(getSignificantFilesChangedSpy).toHaveBeenCalledWith(PR, jasmine.any(RegExp));
        expect(downloadBuildArtifactSpy).toHaveBeenCalledWith(BUILD_NUM, PR, SHA, defaultConfig.buildArtifactPath);
        expect(getPrIsTrustedSpy).toHaveBeenCalledWith(PR);
        expect(createBuildSpy).toHaveBeenCalledWith(PR, SHA, DOWNLOADED_ARTIFACT_PATH, IS_PUBLIC);
      });

      it('should respond with 204 if the reported build is not the "AIO preview" job', async () => {
        BASIC_PAYLOAD.payload.build_parameters.CIRCLE_JOB = 'lint';
        await agent.post(URL).send(BASIC_PAYLOAD).expect(204);
        expect(getGithubInfoSpy).not.toHaveBeenCalled();
        expect(getSignificantFilesChangedSpy).not.toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith(jasmine.any(String), 'UploadServer:        ',
        'Build:12345, Job:lint -', 'Skipping preview processing because this is not the "aio_preview" job.');
        expect(downloadBuildArtifactSpy).not.toHaveBeenCalled();
        expect(getPrIsTrustedSpy).not.toHaveBeenCalled();
        expect(createBuildSpy).not.toHaveBeenCalled();
      });

      it('should respond with 204 if the build did not affect any significant files', async () => {
        AFFECTS_SIGNIFICANT_FILES = false;
        await agent.post(URL).send(BASIC_PAYLOAD).expect(204);
        expect(getGithubInfoSpy).toHaveBeenCalledWith(BUILD_NUM);
        expect(getSignificantFilesChangedSpy).toHaveBeenCalledWith(PR, jasmine.any(RegExp));
        expect(console.log).toHaveBeenCalledWith(jasmine.any(String), 'UploadServer:        ',
          'PR:777, Build:12345 - Skipping preview processing because this PR did not touch any significant files.');
        expect(downloadBuildArtifactSpy).not.toHaveBeenCalled();
        expect(getPrIsTrustedSpy).not.toHaveBeenCalled();
        expect(createBuildSpy).not.toHaveBeenCalled();
      });

      it('should respond with 201 if the build is trusted', async () => {
        IS_PUBLIC = true;
        await agent.post(URL).send(BASIC_PAYLOAD).expect(201);
      });

      it('should respond with 202 if the build is not trusted', async () => {
        IS_PUBLIC = false;
        await agent.post(URL).send(BASIC_PAYLOAD).expect(202);
      });

      it('should not create a preview if the build was not successful', async () => {
        BUILD_INFO.success = false;
        await agent.post(URL).send(BASIC_PAYLOAD).expect(204);
        expect(getGithubInfoSpy).toHaveBeenCalledWith(BUILD_NUM);
        expect(downloadBuildArtifactSpy).not.toHaveBeenCalled();
        expect(getPrIsTrustedSpy).not.toHaveBeenCalled();
        expect(createBuildSpy).not.toHaveBeenCalled();
      });

      it('should fail if the CircleCI request fails', async () => {
        // Note it is important to put the `reject` into `and.callFake`;
        // If you just `and.returnValue` the rejected promise
        // then you get an "unhandled rejection" message in the console.
        getGithubInfoSpy.and.callFake(() => Promise.reject('Test Error'));
        await agent.post(URL).send(BASIC_PAYLOAD).expect(500, 'Test Error');
        expect(getGithubInfoSpy).toHaveBeenCalledWith(BUILD_NUM);
        expect(downloadBuildArtifactSpy).not.toHaveBeenCalled();
        expect(getPrIsTrustedSpy).not.toHaveBeenCalled();
        expect(createBuildSpy).not.toHaveBeenCalled();
      });

      it('should fail if the Github organisation of the build does not match the configured organisation', async () => {
        BUILD_INFO.org = 'bad';
        await agent.post(URL).send(BASIC_PAYLOAD)
          .expect(500, `Invalid webhook: expected "githubOrg" property to equal "organisation" but got "bad".`);
      });

      it('should fail if the Github repo of the build does not match the configured repo', async () => {
        BUILD_INFO.repo = 'bad';
        await agent.post(URL).send(BASIC_PAYLOAD)
          .expect(500, `Invalid webhook: expected "githubRepo" property to equal "repo" but got "bad".`);
      });

      it('should fail if the artifact fetch request fails', async () => {
        downloadBuildArtifactSpy.and.callFake(() => Promise.reject('Test Error'));
        await agent.post(URL).send(BASIC_PAYLOAD).expect(500, 'Test Error');
        expect(getGithubInfoSpy).toHaveBeenCalledWith(BUILD_NUM);
        expect(downloadBuildArtifactSpy).toHaveBeenCalled();
        expect(getPrIsTrustedSpy).not.toHaveBeenCalled();
        expect(createBuildSpy).not.toHaveBeenCalled();
      });

      it('should fail if verifying the PR fails', async () => {
        getPrIsTrustedSpy.and.callFake(() => Promise.reject('Test Error'));
        await agent.post(URL).send(BASIC_PAYLOAD).expect(500, 'Test Error');
        expect(getGithubInfoSpy).toHaveBeenCalledWith(BUILD_NUM);
        expect(downloadBuildArtifactSpy).toHaveBeenCalled();
        expect(getPrIsTrustedSpy).toHaveBeenCalled();
        expect(createBuildSpy).not.toHaveBeenCalled();
      });

      it('should fail if creating the preview build fails', async () => {
        createBuildSpy.and.callFake(() => Promise.reject('Test Error'));
        await agent.post(URL).send(BASIC_PAYLOAD).expect(500, 'Test Error');
        expect(getGithubInfoSpy).toHaveBeenCalledWith(BUILD_NUM);
        expect(downloadBuildArtifactSpy).toHaveBeenCalled();
        expect(getPrIsTrustedSpy).toHaveBeenCalled();
        expect(createBuildSpy).toHaveBeenCalled();
      });
    });


    describe('POST /pr-updated', () => {
      const pr = '9';
      const url = '/pr-updated';
      let bvGetPrIsTrustedSpy: jasmine.Spy;
      let bcUpdatePrVisibilitySpy: jasmine.Spy;

      // Helpers
      const createRequest = (num: number, action?: string) =>
        agent.post(url).send({number: num, action});

      beforeEach(() => {
        bvGetPrIsTrustedSpy = spyOn(buildVerifier, 'getPrIsTrusted');
        bcUpdatePrVisibilitySpy = spyOn(buildCreator, 'updatePrVisibility');
      });


      it('should respond with 404 for non-POST requests', async () => {
        await verifyRequests([
          agent.get(url).expect(404),
          agent.put(url).expect(404),
          agent.patch(url).expect(404),
          agent.delete(url).expect(404),
        ]);
      });


      it('should respond with 400 for requests without a payload', async () => {
        const responseBody = `Missing or empty 'number' field in request: POST ${url} {}`;

        const request1 = agent.post(url);
        const request2 = agent.post(url).send();

        await verifyRequests([
          request1.expect(400, responseBody),
          request2.expect(400, responseBody),
        ]);
      });


      it('should respond with 400 for requests without a \'number\' field', async () => {
        const responseBodyPrefix = `Missing or empty 'number' field in request: POST ${url}`;

        const request1 = agent.post(url).send({});
        const request2 = agent.post(url).send({number: null});

        await verifyRequests([
          request1.expect(400, `${responseBodyPrefix} {}`),
          request2.expect(400, `${responseBodyPrefix} {"number":null}`),
        ]);
      });


      it('should call \'BuildVerifier#gtPrIsTrusted()\' with the correct arguments', async () => {
        await promisifyRequest(createRequest(+pr));
        expect(bvGetPrIsTrustedSpy).toHaveBeenCalledWith(9);
      });


      it('should propagate errors from BuildVerifier', async () => {
        bvGetPrIsTrustedSpy.and.callFake(() => Promise.reject('Test'));

        const req = createRequest(+pr).expect(500, 'Test');

        await promisifyRequest(req);
        expect(bvGetPrIsTrustedSpy).toHaveBeenCalledWith(9);
        expect(bcUpdatePrVisibilitySpy).not.toHaveBeenCalled();
      });


      it('should call \'BuildCreator#updatePrVisibility()\' with the correct arguments', async () => {
        bvGetPrIsTrustedSpy.and.callFake((pr2: number) => Promise.resolve(pr2 === 42));

        await promisifyRequest(createRequest(24));
        expect(bcUpdatePrVisibilitySpy).toHaveBeenCalledWith(24, false);

        await promisifyRequest(createRequest(42));
        expect(bcUpdatePrVisibilitySpy).toHaveBeenCalledWith(42, true);
      });


      it('should propagate errors from BuildCreator', async () => {
        bcUpdatePrVisibilitySpy.and.callFake(() => Promise.reject('Test'));

        const req = createRequest(+pr).expect(500, 'Test');
        await verifyRequests([req]);
      });


      describe('on success', () => {

        it('should respond with 200 (action: undefined)', async () => {
          bvGetPrIsTrustedSpy.and.returnValues(Promise.resolve(true), Promise.resolve(false));

          const reqs = [4, 2].map(num => createRequest(num).expect(200, http.STATUS_CODES[200]));
          await verifyRequests(reqs);
        });


        it('should respond with 200 (action: labeled)', async () => {
          bvGetPrIsTrustedSpy.and.returnValues(Promise.resolve(true), Promise.resolve(false));

          const reqs = [4, 2].map(num => createRequest(num, 'labeled').expect(200, http.STATUS_CODES[200]));
          await verifyRequests(reqs);
        });


        it('should respond with 200 (action: unlabeled)', async () => {
          bvGetPrIsTrustedSpy.and.returnValues(Promise.resolve(true), Promise.resolve(false));

          const reqs = [4, 2].map(num => createRequest(num, 'unlabeled').expect(200, http.STATUS_CODES[200]));
          await verifyRequests(reqs);
        });


        it('should respond with 200 (and do nothing) if \'action\' implies no visibility change', async () => {
          const promises = ['foo', 'notlabeled'].
            map(action => createRequest(+pr, action).expect(200, http.STATUS_CODES[200])).
            map(promisifyRequest);

          await Promise.all(promises);
          expect(bvGetPrIsTrustedSpy).not.toHaveBeenCalled();
          expect(bcUpdatePrVisibilitySpy).not.toHaveBeenCalled();
        });

      });

    });


    describe('ALL *', () => {

      it('should respond with 404', async () => {
        const responseFor = (method: string) => `Unknown resource in request: ${method.toUpperCase()} /some/url`;

        await verifyRequests([
          agent.get('/some/url').expect(404, responseFor('get')),
          agent.put('/some/url').expect(404, responseFor('put')),
          agent.post('/some/url').expect(404, responseFor('post')),
          agent.patch('/some/url').expect(404, responseFor('patch')),
          agent.delete('/some/url').expect(404, responseFor('delete')),
        ]);
      });

    });

  });

});
