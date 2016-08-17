'use strict';

const async = require('async');

const holder = require('./model/value-holder');
const wsRequest = require('./service/request-ws');
const cliUi = require('./service/cli-ui');
const gitFlow = require('./service/git-flow');
const longPolling = require('./service/request-polling');
const csvDiff = require('./service/csv-diff');

const GIT_REPO = process.env.REPO || false;
const WS_LOGIN = process.env.LOGIN || false;
const WS_PASS = process.env.PASS || false;

if (!GIT_REPO || !WS_LOGIN || !WS_PASS) {
  console.log("Some parameter was missed (REPO, LOGIN, PASS)");
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

  return console.timeEnd('done');
  process.exit(0);
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

  let data = {
    'github': GIT_REPO,
    'commit': firstCommit.hash
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

        cliUi.stop().success("Repo Import: OK");
        return callback();
      });
    });
  });
}

function repoUpdate(callback) {

  let commitList = holder.load('repo-commit-list', []);
  let firstCommit = commitList.shift();

  holder.save('repo-update-commit-prev', firstCommit);

  async.mapSeries(commitList, incrementalUpdate, function () {
    callback();
  });
}

function incrementalUpdate(item, callback) {

  let prevItem = holder.load('repo-update-commit-prev');

  /* process */

  const commitFrom = prevItem.hash;
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
        return callback('validation error');
      }

      cliUi.state("processing Update Dataset, send request");
      wsRequest.updateDataset(data, function(error, wsResponse) {

        let errorMsg = error ? error.toString() : wsResponse.getError();

        if(errorMsg) {
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

          cliUi.stop().success("Repo Updated (from: " + commitFrom + "; to: " + commitTo + "): OK");
          holder.save('repo-update-commit-prev', item);
          return callback();
        });
      });
    });
  });
}
