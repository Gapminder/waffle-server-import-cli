'use strict';

const async = require('async');
require('./../service/env-init');

const holder = require('./../model/value-holder');
const wsRequest = require('./../service/request-ws');
const cliUi = require('./../service/cli-ui');
const gitFlow = require('./../service/git-flow');
const formatter = require('./../service/formatter');

/**
 *
 * Automatically Set Default Dataset
 * @param {Object} options
 * @param {Function} complete
 *
 *
 * Object options
 * @attribute {String} login, authentication param to WS
 * @attribute {String} pass, authentication param to WS
 * @attribute {String} repo, github url to repository
 * @attribute {String} commit, (optional) hash of the commit to be set as default
 *
 */

function CliToolApiSetDefault (options, complete) {

  options = options || {};

  // validate

  if (!options.repo || !options.login || !options.pass) {
    const message = "Some parameter was missed (REPO, LOGIN, PASS)";
    cliUi.error(message);
    return callback(message);
  }

  console.time('time::done');

  /* setup flow */

  const wsHost = options.ws_host || 'http://localhost';
  const wsPort = options.ws_port || '3000';

  holder.set('ws-list-choose', `${wsHost}:${wsPort}`);
  holder.save('cli-options', options);

  async.waterfall([
    authentication,
    repoInit,
    setDefaultDataset
  ], function(error, success) {
    
    if(error) {
      cliUi.error(error);
      return complete(error);
    }

    console.timeEnd('time::done');
    return complete();
  });
}

module.exports = CliToolApiSetDefault;



/* additional :: private usage */

function authentication(callback) {

  const cliOptions = holder.load('cli-options');

  let data = {
    email: cliOptions.login,
    password: cliOptions.pass
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

  const cliOptions = holder.load('cli-options');

  gitFlow.getCommitList(cliOptions.repo, function(error, list) {

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

  const commitList = holder.load('repo-commit-list', []);
  const cliOptions = holder.load('cli-options');
  const firstCommit = commitList[0];
  const defaultCommit = !!cliOptions.commit ? cliOptions.commit : firstCommit.hash;

  let data = {
    'datasetName': gitFlow.getRepoName(cliOptions.repo),
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