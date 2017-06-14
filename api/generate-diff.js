'use strict';

const cliUi = require('./../service/cli-ui');
const csvDiff = require('./../service/csv-diff');
const repoService = require('waffle-server-repo-service').default;
repoService.logger = require('../config/logger');

/**
 *
 * Generate difference between commits
 *
 * @param {Object} options
 * @param {Function} complete
 *
 * Object options
 * @attribute {String} hashFrom, hash of the commit for start-border range of Difference
 * @attribute {String} hashTo, hash of the commit for end-border range of Difference
 * @attribute {String} github, github url to repository
 *
 */

function cliApiGenerateDiff (options, complete) {

  options = options || {};

  // validate

  if (!options.hashFrom || !options.hashTo || !options.github) {
    const message = "Some parameter was missed (Hash From, Hash To or Repo Url)";
    cliUi.error(message);
    return complete(message);
  }

  console.time('time::done');

  csvDiff.process(options, function(error, result) {

    console.timeEnd('time::done');

    if (!!error) {
      cliUi.error(error);
      return complete(error);
    }

    return complete(null, result);
  });
}

module.exports = cliApiGenerateDiff;