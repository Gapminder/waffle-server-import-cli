'use strict';

const _ = require('lodash');
require('./../service/env-init');

const gitFlow = require('../service/git-flow');
const cliUi = require('./../service/cli-ui');

function CliToolApiCleanRepos(pathRepos, onComplete) {

  if (!pathRepos) {
    return onComplete("Path to repos folder was missed");
  }

  gitFlow.reposClean(pathRepos, function (error) {
    cliUi.stop();

    if (error) {
      return onComplete(error);
    }

    return onComplete();
  });
}

module.exports = CliToolApiCleanRepos;


