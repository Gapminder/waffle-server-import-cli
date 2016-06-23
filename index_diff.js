'use strict';

/*

 FROM=aafed7d4 TO=5f88ae30 REPO=git@github.com:valor-software/ddf--gapminder_world-stub-1.git npm run diff
 FROM=aafed7d TO=5f88ae3 REPO=git@github.com:valor-software/ddf--gapminder_world-stub-1.git npm run diff
 FROM=5f88ae3 TO=1714b73 REPO=git@github.com:valor-software/ddf--gapminder_world-stub-1.git npm run diff


 FROM=e4eaa8e TO=a7f2d9d REPO=git@github.com:valor-software/ddf--gapminder_world-stub-2.git npm run diff
 FROM=a7f2d9d TO=7d034e3 REPO=git@github.com:valor-software/ddf--gapminder_world-stub-2.git npm run diff


 FROM=e217d99 TO=7c2b7e3 REPO=git@github.com:VS-work/ddf--gapminder_world-stub-4.git npm run diff
 FROM=e217d99 TO=246d133 REPO=git@github.com:VS-work/ddf--gapminder_world-stub-4.git npm run diff

 */

const cliUi = require('./service/cli-ui');
const wsRequest = require('./service/ws-request');
const csvDiff = require('./service/csv-diff');

const gitHashFrom = process.env.FROM || '';
const gitHashTo = process.env.TO || '';
const gitRepo = process.env.REPO || '';

csvDiff.process({
  'hashFrom': gitHashFrom,
  'hashTo': gitHashTo,
  'github': gitRepo
}, function(error, result) {

  let data = {
    'diff': result,
    'github': gitRepo,
    'commit': gitHashTo
  };

  wsRequest.updateDataset(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.error(errorMsg).stop();
      return;
    }

    cliUi.success("* Request completed!").stop();
    return;
  });

});