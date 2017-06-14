'use strict';

const _ = require('lodash');
require('./../service/env-init');

const gitFlow = require('../service/git-flow');
const repoService = require('waffle-server-repo-service').default;
repoService.logger = require('../config/logger');

function CliToolApiGetCommitList(githubUrl, onComplete) {

  if (!githubUrl) {
    const message = "Github Url was missed";
    return onComplete(message);
  }

  gitFlow.getCommitList(githubUrl, function (error, commits) {

    if (error) {
      return onComplete(error);
    }

    const sortedCommitsByDate = _.sortBy(commits, 'date');

    return onComplete(null, _.map(sortedCommitsByDate, 'hash'));
  });
}

module.exports = CliToolApiGetCommitList;


