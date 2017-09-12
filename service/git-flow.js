'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const async = require('async');
const JSONStream = require('JSONStream');
const envConst = require('./../model/env-const');
const utils = require('./git-flow-utils');
const cliUi = require('./../service/cli-ui');
const {reposService} = require('waffle-server-repo-service');

// Export Module
module.exports = {
  getShortHash,
  configDir,
  getRepoName,
  getRepoPath,
  getRepoFolder,
  registerRepo,
  getCommitList,
  getFileDiffByHashes,
  showFileStateByHash,
  validateDataset,
  getDiffFileNameResult,
  reposClean
};

function getShortHash(commit) {
  return !!commit ? commit.substring(0, 7) : '';
};

function configDir(github, callback) {
  return this.getRepoFolder(github, callback);
};

function getRepoName(github) {
  const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);

  if (!githubUrlDescriptor.account || !githubUrlDescriptor.repo) {
    return '';
  }

  const accountAndRepo = `${githubUrlDescriptor.account}/${githubUrlDescriptor.repo}`;
  const isBranchSpecified = githubUrlDescriptor.branch && githubUrlDescriptor.branch !== 'master';

  return isBranchSpecified ? `${accountAndRepo}#${githubUrlDescriptor.branch}` : accountAndRepo;
};

function getRepoPath(github) {
  const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);

  if (githubUrlDescriptor.account && githubUrlDescriptor.repo) {
    return path.join(githubUrlDescriptor.account, githubUrlDescriptor.repo, githubUrlDescriptor.branch);
  }

  return '';
};

function getRepoFolder(github, callback) {
  const absolutePathToRepos = envConst.PATH_REPOS;
  const relativePathToRepo = this.getRepoPath(github);
  const pathToDir = path.resolve(absolutePathToRepos, relativePathToRepo);

  reposService.makeDirForce({pathToDir}, (error) => {
    if (error) {
      return callback(error);
    }

    cliUi.state(`Directory '${pathToDir}' is created`);

    return callback(null, {pathToRepo: pathToDir + '/', relativePathToRepo, absolutePathToRepos});
  });
};

function registerRepo(github, callback) {

  return this.configDir(github, (error, {pathToRepo, relativePathToRepo, absolutePathToRepos}) => {
    if (error) {
      return callback(error);
    }

    const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);
    const context = {github, pathToRepo, relativePathToRepo, absolutePathToRepos, githubUrlDescriptor};

    cliUi.state("git, register repo");

    return utils.updateRepoState(context, callback);
  });
};

function getCommitList(github, done) {
  const self = this;
  const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);
  const context = {github, githubUrlDescriptor};

  cliUi.state("git, get commits list");

  return async.waterfall([
    async.constant(context),
    (externalContext, callback) => {
      self.configDir(externalContext.github, (error, {pathToRepo, relativePathToRepo, absolutePathToRepos}) => {
        if (error) {
          return callback(error);
        }

        externalContext.pathToRepo = pathToRepo;
        externalContext.relativePathToRepo = relativePathToRepo;
        externalContext.absolutePathToRepos = absolutePathToRepos;

        return callback(null, externalContext);
      });
    },
    utils.updateRepoState,
    utils.gitLog
  ], (error, result) => {

    if (error) {
      return done(error);
    }

    const {detailedCommitsList} = result;

    return done(null, detailedCommitsList);
  });
};

function getFileDiffByHashes(externalContext, callback) {

  const self = this;

  const metadata = {
    datapackageOld: {},
    datapackageNew: {}
  };

  const githubUrlDescriptor = utils.getGithubUrlDescriptor(externalContext.github);

  const context = _.extend({
    githubUrlDescriptor,
    gitDiffFileStatus: [],
    gitDiffFileList: [],
    metadata
  }, externalContext);

  cliUi.state("git, get file diff by hashes");

  return async.waterfall([
    async.constant(context),
    (externalContext, done) => {
      self.configDir(externalContext.github, (error, {pathToRepo, relativePathToRepo, absolutePathToRepos}) => {
        if (error) {
          return done(error);
        }

        externalContext.pathToRepo = pathToRepo;
        externalContext.relativePathToRepo = relativePathToRepo;
        externalContext.absolutePathToRepos = absolutePathToRepos;

        return done(null, externalContext);
      });
    },
    utils.updateRepoState,
    utils.getFileStatusesDiff,
    async.apply(utils.checkoutHash, externalContext.hashFrom),
    async.apply(utils.getDatapackage, 'datapackageOld'),
    async.apply(utils.checkoutHash, externalContext.hashTo),
    async.apply(utils.getDatapackage, 'datapackageNew')
  ], (error, result) => {
    if (error) {
      return callback(error);
    }

    cliUi.state('git, finished get file diff by hashes');

    const {metadata, gitDiffFileStatus} = result;
    const gitDiffFileList = _.keys(gitDiffFileStatus);

    return callback(null, {gitDiffFileList, metadata, gitDiffFileStatus});
  });
};

function showFileStateByHash(data, fileName, done) {

  const self = this;
  const context = _.extend({relativeFilePath: fileName}, data);

  async.waterfall([
    async.constant(context),
    (externalContext, done) => {
      self.configDir(externalContext.github, (error, {pathToRepo, relativePathToRepo, absolutePathToRepos}) => {
        if (error) {
          return done(error);
        }

        externalContext.pathToRepo = pathToRepo;
        externalContext.relativePathToRepo = relativePathToRepo;
        externalContext.absolutePathToRepos = absolutePathToRepos;

        return done(null, externalContext);
      });
    },
    async.apply(utils.gitShow, 'from', data.hashFrom),
    async.apply(utils.gitShow, 'to', data.hashTo)
  ], (error, result) => {
    if (error) {
      return done(error);
    }

    const {from, to} = result;

    return done(null, {from, to});
  });
};

function validateDataset(externalContext, onValidationComplete) {
  const self = this;
  const {github, commit = 'HEAD'} = externalContext;
  const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);
  const options = {githubUrlDescriptor, github, commit: commit || 'HEAD'};

  return async.waterfall([
    async.constant(options),
    (options, done) => {
      self.configDir(options.github, (error, {pathToRepo, relativePathToRepo, absolutePathToRepos}) => {
        if (error) {
          return done(error);
        }

        options.pathToRepo = pathToRepo;
        options.relativePathToRepo = relativePathToRepo;
        options.absolutePathToRepos = absolutePathToRepos;

        return done(null, options);
      });
    },
    utils.updateRepoState,
    utils.validateDataset
  ], onValidationComplete);
};

function getDiffFileNameResult(pathFolder, github, additional) {
  const filePath = utils.getGithubUrlDescriptor(github);

  const filePartsResult = [];
  filePartsResult.push('result');
  filePartsResult.push(filePath.account);
  filePartsResult.push(filePath.repo);
  filePartsResult.push(filePath.branch);

  if (additional) {
    filePartsResult.push(additional);
  }

  filePartsResult.push('output.txt');
  return path.resolve(pathFolder, filePartsResult.join('--'));
};

function reposClean(pathToCleaning, onReposCleaned) {
  reposService.removeDirForce({pathToDir: pathToCleaning}, (error) => {
    if (error) {
      return onReposCleaned(error);
    }

    cliUi.state(`Directory '${pathToCleaning}' was cleaned successfully`);

    return onReposCleaned();
  });
};
