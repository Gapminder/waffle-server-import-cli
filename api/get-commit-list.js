'use strict';

const _ = require('lodash');
require('./../service/env-init');

const gitFlow = require('./../service/git-flow');

function CliToolApiGetCommitList(githubUrl, onComplete) {

  if (!githubUrl) {
    const message = "Github Url was missed";
    return onComplete(message);
  }
  gitFlow.getCommitList(githubUrl, function (error, list) {

    list.reverse();

    const arrayHash = [];

    _.map(list, function (name) {
      arrayHash.push(`${name.hash}`);
    });
    if (error) {
      return onComplete(error);
    }
    return onComplete(null, arrayHash);
  });
}

module.exports = CliToolApiGetCommitList;



