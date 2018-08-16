// Imports
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';
import {HIDDEN_DIR_PREFIX} from '../common/constants';
import {GithubApi} from '../common/github-api';
import {GithubPullRequests} from '../common/github-pull-requests';
import {assertNotMissingOrEmpty, getPrInfoFromDownloadPath} from '../common/utils';

// Classes
export class BuildCleaner {

  // Constructor
  constructor(protected buildsDir: string, protected githubOrg: string, protected githubRepo: string,
              protected githubToken: string, protected downloadsDir: string, protected artifactPath: string) {
    assertNotMissingOrEmpty('buildsDir', buildsDir);
    assertNotMissingOrEmpty('githubOrg', githubOrg);
    assertNotMissingOrEmpty('githubRepo', githubRepo);
    assertNotMissingOrEmpty('githubToken', githubToken);
    assertNotMissingOrEmpty('downloadsDir', downloadsDir);
    assertNotMissingOrEmpty('artifactPath', artifactPath);
  }

  // Methods - Public
  public async cleanUp() {
    try {
      this.logger.log('Cleaning up builds and downloads');
      const openPrs = await this.getOpenPrNumbers();
      this.logger.log(`Open pull requests: ${openPrs.length}`);
      await Promise.all([
        this.cleanBuilds(openPrs),
        this.cleanDownloads(openPrs),
      ]);
    } catch (error) {
      this.logger.error('ERROR:', error);
    }
  }

  public async cleanBuilds(openPrs: number[]) {
    const existingBuilds = await this.getExistingBuildNumbers();
    await this.removeUnnecessaryBuilds(existingBuilds, openPrs);
  }

  public async cleanDownloads(openPrs: number[]) {
    const existingDownloads = await this.getExistingDownloads();
    await this.removeUnnecessaryDownloads(existingDownloads, openPrs);
  }

  public getExistingBuildNumbers() {
    return new Promise<number[]>((resolve, reject) => {
      fs.readdir(this.buildsDir, (err, files) => {
        if (err) {
          return reject(err);
        }

        const buildNumbers = files.
          map(name => name.replace(HIDDEN_DIR_PREFIX, '')).   // Remove the "hidden dir" prefix
          map(Number).                                        // Convert string to number
          filter(Boolean);                                    // Ignore NaN (or 0), because they are not builds

        resolve(buildNumbers);
      });
    });
  }

  public async getOpenPrNumbers() {
    const api = new GithubApi(this.githubToken);
    const githubPullRequests = new GithubPullRequests(api, this.githubOrg, this.githubRepo);
    const prs = await githubPullRequests.fetchAll('open');
    return prs.map(pr => pr.number);
  }

  public removeDir(dir: string) {
    try {
      if (shell.test('-d', dir)) {
        shell.chmod('-R', 'a+w', dir);
        shell.rm('-rf', dir);
      }
    } catch (err) {
      console.error(`ERROR: Unable to remove '${dir}' due to:`, err);
    }
  }

  public removeUnnecessaryBuilds(existingBuildNumbers: number[], openPrNumbers: number[]) {
    const toRemove = existingBuildNumbers.filter(num => !openPrNumbers.includes(num));

    console.log(`Existing builds: ${existingBuildNumbers.length}`);
    console.log(`Removing ${toRemove.length} build(s): ${toRemove.join(', ')}`);

    // Try removing public dirs.
    toRemove.
      map(num => path.join(this.buildsDir, String(num))).
      forEach(dir => this.removeDir(dir));

    // Try removing hidden dirs.
    toRemove.
      map(num => path.join(this.buildsDir, HIDDEN_DIR_PREFIX + String(num))).
      forEach(dir => this.removeDir(dir));
  }

  public getExistingDownloads() {
    const artifactFile = path.basename(this.artifactPath);
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(this.downloadsDir, (err, files) => {
        if (err) {
          return reject(err);
        }
        files = files.filter(file => file.endsWith(artifactFile));
        resolve(files);
      });
    });
  }

  public removeUnnecessaryDownloads(existingDownloads: string[], openPrNumbers: number[]) {
    const toRemove = existingDownloads.filter(filePath => {
      const {pr} = getPrInfoFromDownloadPath(filePath);
      return !openPrNumbers.includes(pr);
    });

    console.log(`Existing downloads: ${existingDownloads.length}`);
    console.log(`Removing ${toRemove.length} download(s): ${toRemove.join(', ')}`);

    toRemove.forEach(filePath => shell.rm(filePath));
  }
}
