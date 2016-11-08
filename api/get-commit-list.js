'use strict';

const _ = require('lodash');
require('./../service/env-init');

const gitFlow = require('./../service/git-flow');

function CliToolApiGetCommitList(githubUrl, onComplete) {

  if (!githubUrl) {
    const message = "Github Url was missed";
    return onComplete(message);
  }

  getCommitListByGithubUrl(githubUrl, function (error, hashCommits) {

    if (error) {
      return onComplete(error);
    }

    return onComplete(null, hashCommits);
  });
}

module.exports = CliToolApiGetCommitList;

function getCommitListByGithubUrl(githubUrl, callback) {

  gitFlow.getCommitList(githubUrl, function (error, list) {


    if (error) {
      return callback(error);
    }

    list.reverse();

    const arrayHash = [];

    _.map(list, function (name) {
      arrayHash.push(`${name.hash}`);
    });

    return callback(null, arrayHash);
  });
}
