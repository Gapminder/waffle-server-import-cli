'use strict';

const async = require('async');

require('./service/env-init');
const holder = require('./model/value-holder');
const wsRequest = require('./service/request-ws');
const cliUi = require('./service/cli-ui');
const gitFlow = require('./service/git-flow');
const formatter = require('./service/formatter');

const WS_LOGIN = process.env.LOGIN || false;
const WS_PASS = process.env.PASS || false;
const GIT_REPO = process.env.REPO || false;
const GIT_COMMIT = process.env.COMMIT || false;

if (!GIT_REPO || !WS_LOGIN || !WS_PASS) {
  cliUi.error("Some parameter was missed (REPO, LOGIN, PASS)");
  return;
}

console.time('done');


/* setup flow */

holder.set('ws-list-choose', 'http://localhost:3000');

async.waterfall([
  authentication,
  repoInit,
  setDefaultDataset
], function(error, success) {
  if(error) {
    cliUi.error(error);
  }
  console.timeEnd('done');
  process.exit(0);
  return;
});

return;

/* private */

function authentication(callback) {

  let data = {
    email: WS_LOGIN,
    password: WS_PASS
  };

  wsRequest.authenticate(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if (errorMsg) {
      return callback(errorMsg);
    }

    let responseData = wsResponse.getData();
    holder.save('auth-token', responseData);
    cliUi.success("Authenticate: OK");

    return callback();
  });
}

function repoInit(callback) {

  gitFlow.getCommitList(GIT_REPO, function(error, list) {

    cliUi.stop();

    if(error) {
      return callback(error);
    }

    list.reverse();
    holder.save('repo-commit-list', list);
    cliUi.success("Repo Init: OK");

    return callback();
  });
}

function setDefaultDataset(callback) {

  let commitList = holder.load('repo-commit-list', []);
  const firstCommit = commitList[0];
  const defaultCommit = !!GIT_COMMIT ? GIT_COMMIT : firstCommit.hash;

  let data = {
    'datasetName': gitFlow.getRepoName(GIT_REPO),
    'commit': defaultCommit
  };

  wsRequest.setDefaultDataSet(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.stop();
      return callback(errorMsg);
    }

    let operationData = wsResponse.getData();
    let message = "Default DataSet was set :: ";
    message += operationData.name + " / " + operationData.commit + " / " + formatter.date(operationData.createdAt);

    cliUi.stop().success("Set Default: OK");
    cliUi.success(message);

    callback();
  });
}