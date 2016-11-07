'use strict';

const _ = require('lodash');
const async = require('async');
require('./../service/env-init');

const holder = require('./../model/value-holder');
const cliUi = require('./../service/cli-ui');
const wsRequest = require('./../service/request-ws');
const gitFlow = require('./../service/git-flow');

function CliToolApiGetCommitList(options, complete) {

  options = options || {};

  // validate

  if (!options.repo || !options.login || !options.pass) {
    const message = "Some parameter was missed (REPO, LOGIN, PASS)";
    cliUi.error(message);
    return complete(message);
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
    getCommitListByGithubUrl
  ], function (error, success) {

    if (error) {
      cliUi.error(error);
      return complete(error);
    }

    console.timeEnd('time::done');
    return complete();
  });
}

module.exports = CliToolApiGetCommitList;

function authentication(callback) {

  const cliOptions = holder.load('cli-options');

  let data = {
    email: cliOptions.login,
    password: cliOptions.pass
  };

  wsRequest.authenticate(data, function (error, wsResponse) {

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

  gitFlow.getCommitList(cliOptions.repo, function (error, list) {

    cliUi.stop();

    if (error) {
      return callback(error);
    }

    list.reverse();
    holder.save('repo-commit-list', list);
    cliUi.success("Repo Init: OK");

    return callback();
  });
}

function getCommitListByGithubUrl(callback) {

  const arrayHash = [];

  const commitList = holder.load('repo-commit-list', []);

  _.map(commitList, function (name) {
    arrayHash.push(`${name.hash}`);
  });

  return callback();
}
