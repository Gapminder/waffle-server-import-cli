'use strict';

const async = require('async');

require('./service/env-init');
const holder = require('./model/value-holder');
const wsRequest = require('./service/request-ws');
const cliUi = require('./service/cli-ui');
const gitFlow = require('./service/git-flow');
const longPolling = require('./service/request-polling');
const csvDiff = require('./service/csv-diff');

const GIT_REPO = process.env.REPO || false;
const GIT_FROM = process.env.FROM || false;
const GIT_TO = process.env.TO || false;
const WS_LOGIN = process.env.LOGIN || false;
const WS_PASS = process.env.PASS || false;

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
  repoImport,
  repoUpdate
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

function repoImport(callback) {

  let commitList = holder.load('repo-commit-list', []);
  const firstCommit = commitList[0];
  const importCommitHash = GIT_FROM || firstCommit.hash;

  let data = {
    'github': GIT_REPO,
    'commit': importCommitHash
  };

  cliUi.state("processing Import Dataset, validation");
  gitFlow.validateDataset(data, function(error) {

    if(error) {
      cliUi.stop();
      return callback(error);
    }

    cliUi.state("processing Import Dataset, send request");
    wsRequest.importDataset(data, function(error, wsResponse) {

      let errorMsg = error ? error.toString() : wsResponse.getError();

      if(errorMsg) {
        cliUi.stop();
        return callback(errorMsg);
      }

      let dataState = {
        'datasetName': gitFlow.getRepoName(data.github)
      };

      longPolling.checkDataSet(dataState, function(state){

        // state.success
        if(!state.success) {
          cliUi.stop().logStart().error(state.message).logEnd();
        } else {
          //cliUi.stop().logPrint([state.message]);
        }

        cliUi.stop().success("Repo Import: OK (based on #"+importCommitHash+")");
        return callback();
      });
    });
  });
}

function repoUpdate(callback) {

  let commitList = holder.load('repo-commit-list', []);
  const firstCommit = commitList[0];
  const importCommitHash = GIT_FROM || firstCommit.hash;

  // preprocess commit list

  let importCommitIndex = -1;
  let latestCommitIndex = commitList.length - 1;

  let filteredList = commitList.filter(function(item, itemIndex){

    const result = (importCommitIndex === -1 || itemIndex > latestCommitIndex) ? false : true;

    importCommitIndex = (item.hash === importCommitHash) ? itemIndex : importCommitIndex;
    latestCommitIndex = (item.hash === GIT_TO) ? itemIndex : latestCommitIndex;

    console.log("item", itemIndex, item);
    console.log("result", result);
    console.log("indexes", importCommitIndex, latestCommitIndex);

    return result;
  });

  console.log("importCommitHash", importCommitHash);

  holder.save('repo-update-commit-prev', importCommitHash);

  async.mapSeries(filteredList, incrementalUpdate, function () {
    callback();
  });
}

function incrementalUpdate(item, callback) {

  let prevItemHash = holder.load('repo-update-commit-prev');

  /* process */

  const commitFrom = prevItemHash;
  const commitTo = item.hash;

  csvDiff.process({
    'hashFrom': commitFrom,
    'hashTo': commitTo,
    'github': GIT_REPO
  }, function(error, result) {

    let data = {
      'diff': result,
      'github': GIT_REPO,
      'commit': commitTo
    };

    cliUi.state("processing Update Dataset, validation");
    gitFlow.validateDataset(data, function(error) {

      if(error) {
        cliUi.stop();
        return callback('validation error');
      }

      cliUi.state("processing Update Dataset, send request");
      wsRequest.updateDataset(data, function(error, wsResponse) {

        let errorMsg = error ? error.toString() : wsResponse.getError();

        if(errorMsg) {
          cliUi.stop();
          return callback(errorMsg);
        }

        let operationMsg = wsResponse.getMessage();

        let dataState = {
          'datasetName': gitFlow.getRepoName(GIT_REPO)
        };

        longPolling.checkDataSet(dataState, function(state){

          // state.success
          if(!state.success) {
            cliUi.stop().logStart().error(state.message).logEnd();
          } else {
            //cliUi.stop().logPrint([state.message]);
          }

          cliUi.stop().success("Repo Updated: OK (from: #" + commitFrom + "; to: #" + commitTo + ")");
          holder.save('repo-update-commit-prev', item.hash);
          return callback();
        });
      });
    });
  });
}
