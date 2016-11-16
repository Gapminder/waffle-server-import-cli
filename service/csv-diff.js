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
  const githubUrl = data.github;

  let sourceFolderPath = envConst.PATH_REQUESTS;
  let gitDiffFileStatus = {};

  gitFlow.getFileDiffByHashes(data, gitDiffFileStatus, function (error, gitDiffFileList, metaData) {

    if (!!error) {
      return callback(error);
    }

    const resultFileName = gitFlow.getDiffFileNameResult(sourceFolderPath, githubUrl);
    const resultFileLangName = gitFlow.getDiffFileNameResult(sourceFolderPath, githubUrl, 'lang');

    const streams = {
      diff: fs.createWriteStream(resultFileName),
      lang: fs.createWriteStream(resultFileLangName)
    };

    const datapackages = {
      old: metaData.datapackageOld,
      new: metaData.datapackageNew
    };

    async.mapSeries(
      gitDiffFileList,
      // iteration
      function (fileName, doneMapLimit) {

        gitFlow.showFileStateByHash(data, fileName, function (error, dataDiff) {

          const metaData = {
            fileName: fileName,
            fileModifier: gitDiffFileStatus[fileName],
            datapackage: datapackages
          };

          // external lib
          gitCsvDiff.processUpdated(metaData, dataDiff, streams, function(){
            return doneMapLimit(error);
          });

        });

      },
      // callback
      function (error) {

        // close streams
        streams.diff.end();
        streams.lang.end();

        if (!!error) {
          return callback(error);
        }

        const resultFiles = {
          diff: resultFileName,
          lang: resultFileLangName
        };

        cliUi.stop().success("* Diff generation completed!");
        return callback(false, resultFiles);
      }
    );

  });

};

// Export Module

module.exports = new csvDiff();