'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const hi = require('highland');
const async = require('async');
const shell = require('shelljs');
const JSONStream = require('JSONStream');
const cliUi = require('./../service/cli-ui');
const utils = require('./git-flow-utils');

const simpleGit = require('simple-git');
const GIT_SILENT = true;

const ddfValidation = require('ddf-validation');
const StreamValidator = ddfValidation.StreamValidator;

module.exports = {
  updateRepoState,
  gitCloneIfRepoNotExists,
  gitFetch,
  gitReset,
  gitLog,
  gitShow,
  getFileNamesDiff,
  getFileStatusesDiff,
  checkoutHash,
  validateDataset,
  readJsonFileAsJsonStream,
  getDatapackage,
  getGithubUrlDescriptor,
  gitw
};

function gitw(pathToGit) {
  return simpleGit(pathToGit).silent(GIT_SILENT);
}

function updateRepoState(externalContext, done) {
  return async.waterfall([
    async.constant(externalContext),
    checkSshKey,
    gitCloneIfRepoNotExists,
    gitReset,
    gitFetch
  ], (error) => {
    return done(error, externalContext);
  });
}

function checkSshKey(externalContext, done) {
  cliUi.state('ssh, check ssh-key');

  shell.exec(`ssh -T git@github.com`, {silent: true}, (code, stdout, stderr) => {
    if (code > 1) {
      const error = `${cliUi.CONST_FONT_RED}* [code=${code}] ERROR: ${cliUi.CONST_FONT_YELLOW}${stderr}${cliUi.CONST_FONT_BLUE}\n\tPlease, follow the detailed instruction 'https://github.com/Gapminder/waffle-server-import-cli#ssh-key' for continue working with CLI tool.${cliUi.CONST_FONT_WHITE}`;
      return done(error);
    }

    return done(null, externalContext);
  });
}

function gitShow(field, gitHash, externalContext, done) {
  const {gitFolder} = externalContext;

  cliUi.state('git, try to get repo notes');

  return gitw(gitFolder).show([gitHash], function (error, result) {
    externalContext[field] = !!error ? '' : result;

    if (_.some(['exists on disk, but not in','does not exist in'], (message) => _.includes(error, message))) {
      return done(null, externalContext);
    }

    return done(error, externalContext);
  });
}

function gitCloneIfRepoNotExists(externalContext, done) {
  const {gitFolder, url, branch} = externalContext;

  cliUi.state('git, try to clone repo');

  return gitw(gitFolder).clone(url, gitFolder, ['-b', branch], (error) => {
    // Specified cloning error shouldn't be throw exception in case repo was already cloned
    if (_.includes(error,  'already exists and is not an empty directory')) {
      return done(null, externalContext);
    }

    return done(error, externalContext);
  });
}

function gitFetch(externalContext, done) {
  const {gitFolder, branch} = externalContext;

  cliUi.state('git, fetch updates');

  return gitw(gitFolder).fetch('origin', branch, (error) => done(error, externalContext));
}

function gitReset(externalContext, done) {
  const {gitFolder, branch} = externalContext;

  cliUi.state('git, reset changes');

  return gitw(gitFolder).reset(['--hard', 'origin/' + branch], (error) => done(error, externalContext));
}

function gitLog(externalContext, done) {
  const {gitFolder} = externalContext;

  cliUi.state('git, commits log');

  return gitw(gitFolder).log((error, result) => {
    externalContext.detailedCommitsList = _.get(result, 'all', null);
    return done(error, externalContext);
  });
}

function getFileNamesDiff(externalContext, done) {
  const {gitFolder, hashFrom, hashTo} = externalContext;

  cliUi.state('git, get diff, file-names only');

  return gitw(gitFolder).diff([hashFrom + '..' + hashTo, '--name-only'], (error, resultGitDiff) => {
    if (error) {
      return done(error);
    }

    externalContext.gitDiffFileList = _.chain(resultGitDiff)
      .split('\n')
      .filter(value => !!value && value.indexOf('.csv') !== -1)
      .value();

    return done(null, externalContext);
  });
}

function getFileStatusesDiff(externalContext, done) {
  cliUi.state('git, get diff, file-names with states');

  const {gitFolder, hashFrom, hashTo} = externalContext;

  return gitw(gitFolder).diff([hashFrom + '..' + hashTo, '--name-status'], function (error, resultGitDiff) {
    if (error) {
      return done(error);
    }

    externalContext.gitDiffFileStatus = _.chain(resultGitDiff)
      .split('\n')
      .reduce((result, rawFile) => {

        if (!!rawFile && rawFile.indexOf('.csv') != -1) {
          const fileStat = rawFile.split('\t');
          result[_.last(fileStat)] = _.first(fileStat);
        }

        return result;
      }, {})
      .value();

    return done(null, externalContext);
  });
}

function checkoutHash(hash, externalContext, done) {
  const {gitFolder} = externalContext;

  cliUi.state('git, try to checkout');

  return gitw(gitFolder).checkout(hash, function (error) {
    if (error) {
      return done(error);
    }

    return done(null, externalContext);
  });
}

function validateDataset(externalContext, done) {
  const {gitFolder} = externalContext;

  const streamValidator = new StreamValidator(gitFolder, {
    excludeRules: 'WRONG_DATA_POINT_HEADER',
    excludeDirs: '.gitingore .git',
    isCheckHidden: true
  });

  const issues = [];

  streamValidator.on('issue', function (issue) {
    issues.push(issue);
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

  return ddfValidation.validate(streamValidator);
}

function readJsonFileAsJsonStream(pathToFile) {
  const fileWithChangesStream = fs.createReadStream(pathToFile, {encoding: 'utf8'});
  const jsonStream = fileWithChangesStream.pipe(JSONStream.parse());
  return hi(jsonStream);
}

function getDatapackage(propertyName, externalContext, done) {
  const datapackagePath = externalContext.gitFolder + 'datapackage.json';

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