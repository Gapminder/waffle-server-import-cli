'use strict';

const fs = require('fs');
const async = require("async");
const path = require("path");

const gitFlow = require('./git-flow');
const cliUi = require('./cli-ui');
const envConst = require('./../model/env-const');
const gitCsvDiff = require('git-csv-diff');

function csvDiff() {};

csvDiff.prototype.process = function (data, callback) {

  const resultToFile = data.resultToFile ? true : false;
  const translations = data.translations ? true : false;
  const githubUrl = data.github;

  let sourceFolderPath = envConst.PATH_REQUESTS;
  let dataRequest = {};
  let gitDiffFileStatus = {};

  gitFlow.getFileDiffByHashes(data, gitDiffFileStatus, function (error, gitDiffFileList) {

    if (!!error) {
      return callback(error);
    }

    async.mapSeries(
      gitDiffFileList,
      // iteration
      function (fileName, doneMapLimit) {

        gitFlow.showFileStateByHash(data, fileName, function (error, result) {

          // external lib
          gitCsvDiff.process(fileName, result, gitDiffFileStatus[fileName], function(error, csvDiffResult) {

            // save result of each file
            dataRequest[csvDiffResult.file] = csvDiffResult.diff;
            return doneMapLimit(error);
          });

        });

      },
      // callback
      function (error) {

        if (!!error) {
          return callback(error);
        }

        let result = {
          'files': gitDiffFileStatus,
          'changes': dataRequest
        };

        // additional option
        if (translations) {
          gitCsvDiff.translations(result);
        }

        let resultFileName = gitFlow.getDiffFileNameResult(sourceFolderPath, githubUrl);
        fs.writeFileSync(resultFileName, JSON.stringify(result));

        cliUi.stop().success("* Diff generation completed!");
        return callback(false, result);
      }
    );

  });

};

// Export Module

module.exports = new csvDiff();