'use strict';

const _ = require('lodash');
const fs = require('fs');
const async = require('async');
const mkdirp = require('mkdirp');

const gitFlow = require('./git-flow');
const cliUi = require('./cli-ui');
const envConst = require('./../model/env-const');
const gitCsvDiff = require('git-csv-diff');
const logger = require('../config/logger');

function csvDiff() {};

function createDiffStreams(context, done) {
  const {sourceFolderPath, github} = context;

  return gitFlow.getFileDiffByHashes(context, (error, filesDiff) => {
    if (error) {
      return done(error);
    }

    const {gitDiffFileStatus, metadata, gitDiffFileList} = filesDiff;
    const dirPath = gitFlow.getDiffDirPath(sourceFolderPath, github);

    context.resultFileName = `${dirPath}/output.txt`;
    context.resultFileLangName = `${dirPath}/lang--output.txt`;
    context.gitDiffFileStatus = gitDiffFileStatus;
    context.gitDiffFileList = gitDiffFileList;
    context.metadata = metadata;
   
    mkdirp(dirPath,  function (err) {
      if (err) {
        return done(err);
      }
      
      context.streams = {
        diff: fs.createWriteStream(context.resultFileName),
        lang: fs.createWriteStream(context.resultFileLangName)
      };
  
      return done(null, context);
    });
  });
}

function processDiffFiles(context, done) {
  const {gitDiffFileList, metadata, gitDiffFileStatus, streams} = context;

  logger.info({source: 'import-cli', message: 'gitDiffFileList', gitDiffFileStatus, context});

  return async.eachOfSeries(
    gitDiffFileStatus,
    // iteration
    (state, fileName, onFileProcessed) => {
      return gitFlow.showFileStateByHash(context, fileName, function (error, dataDiff) {
        if (error) {
          return onFileProcessed(error);
        }

        const metaData = {
          fileName: fileName,
          fileModifier: gitDiffFileStatus[fileName],
          datapackage: {
            old: metadata.datapackageOld,
            new: metadata.datapackageNew
          }
        };

        // external lib
        return gitCsvDiff.processUpdated(metaData, dataDiff, streams, () => onFileProcessed());
      });
    }, (error) => {
      return done(error, context);
    }
  );
}

csvDiff.prototype.process = function (externalContext, done) {
  const sourceFolderPath = _.get(externalContext, 'resultPath', envConst.PATH_REQUESTS);
  const context = _.extend({sourceFolderPath}, externalContext);

  async.waterfall([
    async.constant(context),
    createDiffStreams,
    processDiffFiles
  ], (error, result) => {
    if (error) {
      return done(error);
    }

    // close streams
    const diff = _.get(result.streams, 'diff');
    const lang = _.get(result.streams, 'lang');

    if (diff) {
      diff.end();
    }
    if (lang) {
      lang.end();
    }

    const resultFiles = {
      diff: result.resultFileName,
      lang: result.resultFileLangName,
      fileList: result.gitDiffFileList
    };

    cliUi.stop().success('* Diff generation completed!');

    return done(null, resultFiles);
  });
};

// Export Module

module.exports = new csvDiff();
