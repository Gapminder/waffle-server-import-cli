'use strict';

const fs = require('fs');
const path = require('path');
const async = require("async");
const shell = require("shelljs");
const cliUi = require('./../service/cli-ui');
const envConst = require('./../model/env-const');

const ddfValidation = require('ddf-validation');
const StreamValidator = ddfValidation.StreamValidator;

let sourceFolderPath = envConst.PATH_REPOS;

const simpleGit = require('simple-git');
const GIT_SILENT = true;

function gitFlow() {
}

function gitw(pathToGit) {
  return simpleGit(pathToGit).silent(GIT_SILENT);
}


gitFlow.prototype.getShortHash = function (commit) {
  return !!commit ? commit.substring(0, 7) : '';
};

gitFlow.prototype.configDir = function (github) {
  return this.getRepoFolder(github) + "/";
};


gitFlow.prototype.getRepoName = function (github) {
  const githubUrlDescriptor = getGithubUrlDescriptor(github);

  if (!githubUrlDescriptor.account || !githubUrlDescriptor.repo) {
    return '';
  }

  const accountAndRepo = `${githubUrlDescriptor.account}/${githubUrlDescriptor.repo}`;
  const isBranchSpecified = githubUrlDescriptor.branch && githubUrlDescriptor.branch !== 'master';

  return isBranchSpecified ? `${accountAndRepo}#${githubUrlDescriptor.branch}` : accountAndRepo;
};

gitFlow.prototype.getRepoPath = function (github) {
  const githubUrlDescriptor = getGithubUrlDescriptor(github);

  if (githubUrlDescriptor.account && githubUrlDescriptor.repo) {
    return path.join(githubUrlDescriptor.account, githubUrlDescriptor.repo, githubUrlDescriptor.branch)
  }

  return '';
};

gitFlow.prototype.getRepoFolder = function (github) {
  let regexpFolderGitFolder = this.getRepoPath(github);
  let targetFolder = path.join(sourceFolderPath, regexpFolderGitFolder);
  if(!fs.existsSync(targetFolder)) {
    shell.mkdir('-p', targetFolder);
  }
  return targetFolder;
};

gitFlow.prototype.registerRepo = function (github, callback) {

  let self = this;
  let gitFolder = this.configDir(github);
  var githubUrlDescriptor = getGithubUrlDescriptor(github);

  cliUi.state("git, clone repo");
  gitw(gitFolder).clone(github, gitFolder, ['-b', githubUrlDescriptor.branch], function(error, result){

    cliUi.state("git, download updates");
    gitw(gitFolder).fetch('origin', githubUrlDescriptor.branch, function(error, result){

      if(error) {
        return callback(error);
      }

      gitw(gitFolder).reset(['--hard', `origin/${githubUrlDescriptor.branch}`], function(error, result){

        if(error) {
          return callback(error);
        }

        return callback();
      });
    });
  });

};

gitFlow.prototype.getCommitList = function (github, callback) {

  let self = this;
  let gitFolder = this.configDir(github);

  this.registerRepo(github, function(){

    cliUi.state("git, process log");
    gitw(gitFolder).log(function(error, result){

      if(error) {
        return callback(error);
      }

      let commits = result.all;
      let commitsList = commits.map(function(item){
        return {
          hash: self.getShortHash(item.hash),
          message: item.message
        };
      });

      return callback(false, commitsList);
    });

  });
};

gitFlow.prototype.getFileDiffByHashes = function (data, gitDiffFileStatus, callback) {

  let github = data.github;
  let hashFrom = data.hashFrom;
  let hashTo = data.hashTo;

  let self = this;
  let gitFolder = this.configDir(github);

  this.registerRepo(github, function(){

    cliUi.state("git, get diff, file-names only");
    gitw(gitFolder).diff([hashFrom + '..' + hashTo, "--name-only"], function(error, result) {

      if(error) {
        return callback(error);
      }

      let resultGitDiff = result;
      let gitDiffFileList = resultGitDiff.split("\n").filter(function(value){
        return !!value && value.indexOf(".csv") != -1;
      });

      // fix path with folders
      gitDiffFileList.forEach(function(item, index, arr){
        arr[index] = path.parse(item).base;
      });

      cliUi.state("git, get diff, file-names with states");
      gitw(gitFolder).diff([hashFrom + '..' + hashTo, "--name-status"], function(error, result) {

        result.split("\n").filter(function(value) {
          return !!value && value.indexOf(".csv") != -1;
        }).map(function(rawFile) {
          let fileStat = rawFile.split("\t");
          gitDiffFileStatus[fileStat[1]] = fileStat[0];
        });

        callback(null, gitDiffFileList);

      });
    });

  });
};

gitFlow.prototype.showFileStateByHash = function (data, fileName, callback) {

  let gitRepo = data.github;

  let self = this;
  const gitFolder = this.configDir(gitRepo);

  let gitHashFrom = data.hashFrom + ':' + fileName;
  let gitHashTo = data.hashTo + ':' + fileName;

  async.waterfall(
      [
        function(done) {

          gitw(gitFolder).show([gitHashFrom], function(error, result){
            result = !!error ? '' : result;
            return done(null, result);
          });

        },
        function(dataFrom, done) {

          gitw(gitFolder).show([gitHashTo], function(error, result){
            result = !!error ? '' : result;
            return done(null, {from: dataFrom, to: result});
          });

        }
      ],
      // callback
      function(error, result) {
        callback(error, result);
      }
  );
};

gitFlow.prototype.validateDataset = function (data, callback) {

  let self = this;

  let gitRepo = data.github;
  let gitCommit = data.commit;

  let gitFolder = this.configDir(gitRepo);

  gitw(gitFolder).checkout(gitCommit, function(error, result) {

    if(error) {
      return callback(error);
    }

    let streamValidator = new StreamValidator(gitFolder, {
      includeTags: 'WAFFLE_SERVER',
      excludeRules: 'FILENAME_DOES_NOT_MATCH_HEADER',
      excludeDirs: '.gitingore README.md',
      isCheckHidden: true,
      indexlessMode: true});

    let issues = [];

    streamValidator.on('issue', function(issue) {
      issues.push(issue);
    });

    streamValidator.on('finish', function(err) {
      if(issues.length) {
        return callback(issues);
      }
      return callback(null);
    });

    ddfValidation.validate(streamValidator);
  });

};

gitFlow.prototype.getDiffFileNameResult = function (pathFolder, github) {
  const filePath = getGithubUrlDescriptor(github);

  const filePartsResult = [];
  filePartsResult.push('result');
  filePartsResult.push(filePath.account);
  filePartsResult.push(filePath.repo);
  filePartsResult.push(filePath.branch);
  filePartsResult.push('output.json');

  return path.resolve(pathFolder, filePartsResult.join("--"));
}

function getGithubUrlDescriptor(githubUrl) {
  const regexpFolderRes = /:(.+)\/(.+)\.git(#(.+))?/.exec(githubUrl);

  return {
    account: regexpFolderRes[1] || '',
    repo: regexpFolderRes[2] || '',
    branch: regexpFolderRes[4] || 'master'
  }
}
// Export Module

module.exports = new gitFlow();