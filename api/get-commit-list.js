'use strict';

const _ = require('lodash');require('./../service/env-init');

const holder = require('./../model/value-holder');
const cliUi = require('./../service/cli-ui');
const gitFlow = require('./../service/git-flow');

function CliToolApiGetCommitList(options, onComplete) {

  options = options || {};

  // validate

  if (!options.repo || !options.login || !options.pass) {
    const message = "Some parameter was missed (REPO, LOGIN, PASS)";
    cliUi.error(message);
    return onComplete(message);
  }

  console.time('time::done');

  /* setup flow */

  const wsHost = options.ws_host || 'http://localhost';
  const wsPort = options.ws_port || '3000';

  holder.set('ws-list-choose', `${wsHost}:${wsPort}`);
  holder.save('cli-options', options);

    getCommitListByGithubUrl(function (error, hashCommits) {

    if (error) {
      cliUi.error(error);
      return onComplete(error);
    }
    console.timeEnd('time::done');
    return onComplete(null, hashCommits);
  });
}

module.exports = CliToolApiGetCommitList;

function getCommitListByGithubUrl(callback) {

  const cliOptions = holder.load('cli-options');

  gitFlow.getCommitList(cliOptions.repo, function (error, list) {

    cliUi.stop();

    if (error) {
      return callback(error);
    }

    list.reverse();
    holder.save('repo-commit-list', list);
    cliUi.success("Repo Init: OK");

    const arrayHash = [];

    const commitList = holder.load('repo-commit-list', []);

    _.map(commitList, function (name) {
      arrayHash.push(`${name.hash}`);
    });

    return callback(null, arrayHash);
  });
}
