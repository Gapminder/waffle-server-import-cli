'use strict';

const _ = require('lodash');
require('./../service/env-init');

const gitFlow = require('./../service/git-flow');

function CliToolApiGetCommitList(githubUrl, onComplete) {

  if (!githubUrl) {
    const message = "Github Url was missed";
    return onComplete(message);
  }

  gitFlow.getCommitList(githubUrl, function (error, commits) {

    if (error) {
      return onComplete(error);
    }

    commits.reverse();

    const arrayHash = [];

    _.map(commits, function (name) {
      arrayHash.push(`${name.hash}`);
    });

    return onComplete(null, arrayHash);
  });
}

module.exports = CliToolApiGetCommitList;


