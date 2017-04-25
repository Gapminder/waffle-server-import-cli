'use strict';

const async = require('async');

const wsRequest = require('../service/request-ws');
const cliUi = require('../service/cli-ui');
const gitFlow = require('../service/git-flow');
const formatter = require('../service/formatter');

const envConst = require('../model/env-const');

module.exports = {
  getPrestoredQueries,
  cacheClean,
  reposClean
};

function getPrestoredQueries(done) {
  return wsRequest.getPrestoredQueries({}, function (error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if (errorMsg) {
      cliUi.stop().logStart().error(errorMsg).logEnd();
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    let logRows = [];
    let responseData = wsResponse.getData([]);

    responseData.forEach(function (item) {
      logRows.push('\n');
      logRows.push('> ' + item.datasetName);
      logRows.push('  - version : ' + item.version);
      logRows.push('  - date    : ' + formatter.date(item.createdAt));
      //logRows.push("  - url     : " + item.url);
    });
    logRows.push('\n');

    cliUi.stop().logPrint(logRows);
    done(null, true);
  });
}

function cacheClean(done) {
  return wsRequest.cacheClean({}, function (error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if (errorMsg) {
      cliUi.stop().logStart().error(errorMsg).logEnd();
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    cliUi.stop().logStart().success('* Cache invalidated successfully!').logEnd();
    done(null, true);
  });
}

function reposClean(done) {
  return async.series([
    (done) => gitFlow.reposClean(envConst.PATH_REPOS, (error) => {
      return async.setImmediate(() => done(error));
    }),
    (done) => wsRequest.reposClean({}, (error, wsResponse) => {
      return done(error ? error.toString() : wsResponse.getError());
    })
  ], (error) => {
    if (error) {
      cliUi.stop().logStart().error(error).logEnd();
      return done(null, true);
    }

    cliUi.stop().logStart().success('* Repos removed successfully!').logEnd();
    return done(null, true);
  });
}