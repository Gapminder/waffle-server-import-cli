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

function gitFlow() {
}

gitFlow.prototype.getShortHash = function (commit) {
  return !!commit ? commit.substring(0, 7) : '';
};

gitFlow.prototype.configDir = function (github, callback) {
  return this.getRepoFolder(github, callback);
};

gitFlow.prototype.getRepoName = function (github) {
  const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);

  if (!githubUrlDescriptor.account || !githubUrlDescriptor.repo) {
    return '';
  }

  const accountAndRepo = `${githubUrlDescriptor.account}/${githubUrlDescriptor.repo}`;
  const isBranchSpecified = githubUrlDescriptor.branch && githubUrlDescriptor.branch !== 'master';

  return isBranchSpecified ? `${accountAndRepo}#${githubUrlDescriptor.branch}` : accountAndRepo;
};

gitFlow.prototype.getRepoPath = function (github) {
  const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);

  if (githubUrlDescriptor.account && githubUrlDescriptor.repo) {
    return path.join(githubUrlDescriptor.account, githubUrlDescriptor.repo, githubUrlDescriptor.branch);
  }

  return '';
};

gitFlow.prototype.getRepoFolder = function (github, callback) {
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

gitFlow.prototype.registerRepo = function (github, callback) {

  return this.configDir(github, (error, {pathToRepo, relativePathToRepo, absolutePathToRepos}) => {
    if (error) {
      return callback(error);
    }

    const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);
    const context = {github, pathToRepo, relativePathToRepo, absolutePathToRepos, branch: githubUrlDescriptor.branch, url: githubUrlDescriptor.url};

    cliUi.state("git, register repo");

    return utils.updateRepoState(context, callback)
  });
};

gitFlow.prototype.getCommitList = function (github, done) {

  const self = this;
  const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);
  const context = {github, branch: githubUrlDescriptor.branch, url: githubUrlDescriptor.url};

  cliUi.state("git, get commits list");

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
    utils.gitLog
  ], (error, result) => {

    if (error) {
      return done(error);
    }

    const {detailedCommitsList} = result;

    return done(null, detailedCommitsList);
  });
};

gitFlow.prototype.getFileDiffByHashes = function (externalContext, callback) {

  const self = this;

  const metadata = {
    datapackageOld: {},
    datapackageNew: {}
  };

  const githubUrlDescriptor = utils.getGithubUrlDescriptor(externalContext.github);

  const context = _.extend({
    branch: githubUrlDescriptor.branch,
    url: githubUrlDescriptor.url,
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

gitFlow.prototype.showFileStateByHash = function (data, fileName, done) {

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

gitFlow.prototype.validateDataset = function (data, done) {

  const self = this;
  const gitCommit = data.commit;

  return async.waterfall([
    async.constant(data),
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
    async.apply(utils.checkoutHash, gitCommit),
    utils.validateDataset
  ], done);
};

gitFlow.prototype.getDiffFileNameResult = function (pathFolder, github, additional) {
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

gitFlow.prototype.reposClean = function (pathToCleaning, onReposCleaned) {
  reposService.removeDirForce(pathToCleaning, (error) => {
    if (error) {
      return onReposCleaned(error);
    }

    cliUi.state(`Directory '${pathToCleaning}' was cleaned successfully`);

    return onReposCleaned();
  });
};

// Export Module
module.exports = new gitFlow();