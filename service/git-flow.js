'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const async = require('async');
const shell = require('shelljs');
const JSONStream = require('JSONStream');
const envConst = require('./../model/env-const');
const utils = require('./git-flow-utils');
const cliUi = require('./../service/cli-ui');

function gitFlow() {
}

gitFlow.prototype.getShortHash = function (commit) {
  return !!commit ? commit.substring(0, 7) : '';
};

gitFlow.prototype.configDir = function (github) {
  return this.getRepoFolder(github) + '/';
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

gitFlow.prototype.getRepoFolder = function (github) {

  const regexpFolderGitFolder = this.getRepoPath(github);
  const targetFolder = path.join(envConst.PATH_REPOS, regexpFolderGitFolder);

  if (!fs.existsSync(targetFolder)) {

    cliUi.state(`Try to create directory '${targetFolder}'`);

    shell.mkdir('-p', targetFolder);

    if (shell.error()) {
      throw new Error(`Something went wrong during creation directory process`);
    }
  }

  return targetFolder;
};

gitFlow.prototype.registerRepo = function (github, callback) {

  const gitFolder = this.configDir(github);
  const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);
  const context = {github, gitFolder, branch: githubUrlDescriptor.branch, url: githubUrlDescriptor.url};

  cliUi.state("git, register repo");

  return utils.updateRepoState(context, callback);
};

gitFlow.prototype.getCommitList = function (github, done) {

  const self = this;
  const gitFolder = this.configDir(github);
  const githubUrlDescriptor = utils.getGithubUrlDescriptor(github);
  const context = {github, gitFolder, branch: githubUrlDescriptor.branch, url: githubUrlDescriptor.url};

  cliUi.state("git, get commits list");

  return async.waterfall([
    async.constant(context),
    utils.updateRepoState,
    utils.gitLog
  ], (error, result) => {

    if (error) {
      return done(error);
    }

    const {detailedCommitsList} = result;
    const commitsList = _.map(detailedCommitsList, item => ({
      hash: self.getShortHash(item.hash),
      message: item.message,
      date: item.date
    }));

    return done(null, commitsList);
  });
};

gitFlow.prototype.getFileDiffByHashes = function (externalContext, callback) {

  const self = this;
  const gitFolder = self.configDir(externalContext.github);

  const metadata = {
    datapackageOld: {},
    datapackageNew: {}
  };

  const githubUrlDescriptor = utils.getGithubUrlDescriptor(externalContext.github);

  const context = _.extend({
    gitFolder,
    branch: githubUrlDescriptor.branch,
    url: githubUrlDescriptor.url,
    gitDiffFileStatus: [],
    gitDiffFileList: [],
    metadata
  }, externalContext);

  cliUi.state("git, get file diff by hashes");

  return async.waterfall([
    async.constant(context),
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

  const gitRepo = data.github;
  const gitFolder = this.configDir(gitRepo);
  const gitHashFrom = data.hashFrom + ':' + fileName;
  const gitHashTo = data.hashTo + ':' + fileName;

  async.waterfall([
    async.constant({gitFolder}),
    async.apply(utils.gitShow, 'from', gitHashFrom),
    async.apply(utils.gitShow, 'to', gitHashTo)
  ], (error, result) => {
    if (error) {
      return done(error);
    }

    const {from, to} = result;

    return done(null, {from, to});
  });
};

gitFlow.prototype.validateDataset = function (data, done) {

  const gitRepo = data.github;
  const gitCommit = data.commit;

  const gitFolder = this.configDir(gitRepo);

  return async.waterfall([
    async.constant({gitFolder}),
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

gitFlow.prototype.reposClean = function (pathRepos, onReposCleaned) {
  if (fs.existsSync(pathRepos)) {
    cliUi.state(`Try to clean directory '${pathRepos}'`);

    shell.rm('-rf', pathRepos + '/*');

    return onReposCleaned(shell.error());
  }

  return onReposCleaned(`Directory '${pathRepos}' is not exist!`);
};

// Export Module
module.exports = new gitFlow();