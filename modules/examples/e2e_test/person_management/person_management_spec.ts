import {verifyNoBrowserErrors} from 'angular2/src/test_lib/e2e_util';

describe('Person Management CRUD', function() {
  var URL = 'examples/src/person_management/index.html';

  it('should work', function() {
    browser.get(URL);
    verifyNoBrowserErrors();
  });
});
