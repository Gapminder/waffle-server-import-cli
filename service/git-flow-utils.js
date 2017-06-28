'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const hi = require('highland');
const async = require('async');
const JSONStream = require('JSONStream');
const cliUi = require('./../service/cli-ui');
const utils = require('./git-flow-utils');
const {reposService} = require('waffle-server-repo-service');
const envConst = require('./../model/env-const');
const logger = require('../config/logger');

const ddfValidation = require('ddf-validation');
const StreamValidator = ddfValidation.StreamValidator;

module.exports = {
  updateRepoState,
  gitCloneIfRepoNotExists,
  gitFetch,
  gitReset,
  gitLog,
  gitShow,
  getFileStatusesDiff,
  checkoutHash,
  validateDataset,
  readJsonFileAsJsonStream,
  getDatapackage,
  getGithubUrlDescriptor
};

function updateRepoState(externalContext, done) {
  return async.waterfall([
    async.constant(externalContext),
    checkSshKey,
    gitCloneIfRepoNotExists,
    gitFetch,
    gitReset
  ], (error) => {
    return done(error, externalContext);
  });
}

function checkSshKey(externalContext, done) {
  cliUi.state('ssh, check ssh-key');

  reposService.checkSshKey({silent: true}, (error) => {
    if (error) {
      const [code, message, proposal] = error.split('\n');
      const prettifiedError = `${cliUi.CONST_FONT_RED}* [code=${code}] ERROR: ${cliUi.CONST_FONT_YELLOW}${message}${cliUi.CONST_FONT_BLUE}\n\t${proposal}${cliUi.CONST_FONT_WHITE}`;
      return done(prettifiedError);
    }

    return done(null, externalContext);
  });
}

function gitShow(field, commit, externalContext, done) {
  const {pathToRepo, relativeFilePath} = externalContext;

  cliUi.state('git, get repo notes');

  if (typeof relativeFilePath === 'undefined') {
    logger.error({source: 'import-cli', message: 'undefined', field, commit, pathToRepo, relativeFilePath, externalContext});
  }

  return reposService.show({commit, relativeFilePath, pathToRepo}, function (error, result) {
    externalContext[field] = !!error ? '' : result;
    logger.info({source: 'import-cli', field, commit, relativeFilePath, pathToRepo, result});

    if (_.some(['exists on disk, but not in','does not exist in'], (message) => _.includes(error, message))) {
      return done(null, externalContext);
    }

    return done(error, externalContext);
  });
}

function gitCloneIfRepoNotExists(externalContext, done) {
  const {absolutePathToRepos, relativePathToRepo, url: githubUrl, branch} = externalContext;

  cliUi.state('git, clone repo');

  return reposService.silentClone({absolutePathToRepos, relativePathToRepo, githubUrl, branch}, (error) => done(error, externalContext));
}

function gitFetch(externalContext, done) {
  const {pathToRepo, branch} = externalContext;

  cliUi.state('git, fetch updates');

  return reposService.fetch({pathToRepo, branch}, (error) => done(error, externalContext));
}

function gitReset(externalContext, done) {
  const {pathToRepo, branch} = externalContext;

  cliUi.state('git, reset changes');

  return reposService.reset({pathToRepo, branch}, (error) => done(error, externalContext));
}

function gitLog(externalContext, done) {
  const {pathToRepo, branch} = externalContext;

  cliUi.state('git, get commits log');

  const prettifyResult = (stdout) => _.split(stdout, '\n\n').filter(commitDescriptor => !!commitDescriptor).map(commitDescriptor => {
    const [hash, date, fullDate, message] = _.chain(commitDescriptor).trim('\n').split('\n').value();
    return {hash, date, fullDate, message};
  });

  return reposService.log({pathToRepo, branch, prettifyResult}, (error, result) => {

    externalContext.detailedCommitsList = result;

    return done(error, externalContext);
  });
}

function getFileStatusesDiff(externalContext, done) {
  cliUi.state('git, get diff file names with states');

  const {pathToRepo, hashFrom: commitFrom, hashTo: commitTo} = externalContext;

  const prettifyResult = (resultGitDiff) =>  _.chain(resultGitDiff)
    .split('\n')
    .reduce((result, rawFile) => {
      const [status, filename] = rawFile.split('\t');

      if (typeof filename !== 'undefined') {
        result[filename] = status;
      }

      return result;
    }, {})
    .value();

  return reposService.diff({pathToRepo, commitFrom, commitTo, prettifyResult}, (error, gitDiffFileStatus = {}) => {
    logger.info({obj: {source: 'import-cli', gitDiffFileStatus, pathToRepo, commitFrom, commitTo, prettifyResult}});

    externalContext.gitDiffFileStatus = gitDiffFileStatus;

    return done(error, externalContext);
  });
}

function checkoutHash(commit, externalContext, done) {
  const {pathToRepo} = externalContext;

  cliUi.state(`git, checkout to '${commit}'`);

  return reposService.checkoutToCommit({pathToRepo, commit}, (error) => done(error, externalContext));

}

function validateDataset(externalContext, done) {
  const {pathToRepo} = externalContext;

  cliUi.state('validator, check dataset validity');

  const streamValidator = new StreamValidator(pathToRepo, {
    excludeRules: 'WRONG_DATA_POINT_HEADER',
    excludeDirs: '.gitingore, .git',
    isCheckHidden: true,
    isMultithread: true
  });

  const issues = [];

  streamValidator.on('issue', function (issue) {
    issues.push(JSON.stringify(issue, null, 2));
  });

  streamValidator.on('finish', function (error) {
    if (error) {
      cliUi.stop().error(`* Validation Error: ${error}`);
      return done(error);
    }

    if (issues.length) {
      cliUi.stop().error('* Validation Error!');
      return done(issues);
    }

    cliUi.stop().success('* Validation completed!');
    return done();
  });

  streamValidator.on('error', function (error) {
    logger.error({obj: {error, externalContext, issues}});
  });

  return ddfValidation.validate(streamValidator);
}

function readJsonFileAsJsonStream(pathToFile) {
  const fileWithChangesStream = fs.createReadStream(pathToFile, {encoding: 'utf8'});
  const jsonStream = fileWithChangesStream.pipe(JSONStream.parse());
  return hi(jsonStream);
}

function getDatapackage(propertyName, externalContext, done) {
  cliUi.state(`stream, read file 'datapackage.json'`);

  const datapackagePath = externalContext.pathToRepo + 'datapackage.json';

  if (fs.existsSync(datapackagePath)) {
    return readJsonFileAsJsonStream(datapackagePath)
      .toCallback((error, datapackageContent) => {

        if (error) {
          return done(error);
        }

        externalContext.metadata[propertyName] = datapackageContent;

        return done(null, externalContext);
      });
  }

  return async.setImmediate(() => done('`datapackage.json` is absent'));
}

function getGithubUrlDescriptor(githubUrl) {
  const regexpFolderRes = /:(.+)\/(.+)\.git(#(.+))?/.exec(githubUrl);

  return {
    account: _.get(regexpFolderRes, '1', ''),
    repo: _.get(regexpFolderRes, '2', ''),
    branch: _.get(regexpFolderRes, '4', 'master'),
    url: _.first(_.split(githubUrl, '#'))
  };
}
