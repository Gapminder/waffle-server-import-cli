'use strict';

const _ = require('lodash');
require('./../service/env-init');

const gitFlow = require('../service/git-flow');
const cliUi = require('./../service/cli-ui');

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
    const sortedHashesByDate = _.map(sortedCommitsByDate, 'hash');

    cliUi.stop().success(`* Hashes list: ${sortedHashesByDate.join(', ')}`);

    return onComplete(null, sortedHashesByDate);
  });
}

module.exports = CliToolApiGetCommitList;


