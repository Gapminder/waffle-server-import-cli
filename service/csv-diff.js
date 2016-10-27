'use strict';

const daff = require('daff');
const fs = require('fs');
const async = require("async");

const gitFlow = require('./git-flow');
const cliUi = require('./cli-ui');
const envConst = require('./../model/env-const');
const gitCsvDiff = require('git-csv-diff');

function csvDiff() {};

csvDiff.prototype.process = function (data, callback) {

  data.sourceFolder = envConst.PATH_REPOS;
  gitCsvDiff.process(data, function(error, result) {

    if(!!error) {
      cliUi.stop().error(error);
      return callback(error);
    }

    cliUi.stop().success("* Diff generation completed!");
    return callback(false, result);
  });

};

// Export Module

module.exports = new csvDiff();