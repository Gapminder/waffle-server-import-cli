'use strict';

const fs = require('fs');
const path = require('path');
const async = require("async");
const cliUi = require('./../service/cli-ui');

let sourceFolder = fs.realpathSync('./');
let sourceFolderPath = sourceFolder + '/repos/';

const simpleGit = require('simple-git')();
const GIT_SILENT = true;

function gitFlow() {
  if(!fs.existsSync(sourceFolderPath)) {
    fs.mkdirSync(sourceFolderPath);
  }
};


gitFlow.prototype.getShortHash = function (commit) {
  return !!commit ? commit.substring(0, 7) : '';
};

gitFlow.prototype.configDir = function (github) {
  let gitFolder = this.getRepoFolder(github);
  simpleGit._baseDir = gitFolder;
  return gitFolder + "/";
};


gitFlow.prototype.getRepoName = function (github) {
  let regexpFolder = /\/(.+)\.git/;
  let regexpFolderRes = regexpFolder.exec(github);
  let regexpFolderGitFolder = regexpFolderRes[1] || false;
  return regexpFolderGitFolder || '';
};

gitFlow.prototype.getRepoFolder = function (github) {
  let regexpFolderGitFolder = this.getRepoName(github);
  let targetFolder = sourceFolderPath + regexpFolderGitFolder;
  if(!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }
  return targetFolder;
};

gitFlow.prototype.getCommitList = function (github, callback) {

  let self = this;
  let gitFolder = this.configDir(github);

  cliUi.state("git, get commit list, clone repo");
  simpleGit.silent(GIT_SILENT).clone(github, gitFolder, function(error, result){

    cliUi.state("git, get commit list, download updates");
    simpleGit.silent(GIT_SILENT).pull('origin', 'master', function(error, result){

      cliUi.state("git, get commit list, process log");
      simpleGit.silent(GIT_SILENT).log(function(error, result){

        let commits = result.all;
        let commitsList = commits.map(function(item){
          return {
            hash: self.getShortHash(item.hash),
            message: item.message
          };
        });

        cliUi.stop();
        callback(false, commitsList);
      });
    });
  });

};

gitFlow.prototype.getFileDiffByHashes = function (data, gitDiffFileStatus, callback) {

  let github = data.github;
  let hashFrom = data.hashFrom;
  let hashTo = data.hashTo;

  let self = this;
  let gitFolder = this.configDir(github);

  cliUi.state("git, get files diff, clone repo");
  simpleGit.silent(GIT_SILENT).clone(github, gitFolder, function(error, result){

    cliUi.state("git, get files diff, download updates");
    simpleGit.silent(GIT_SILENT).pull('origin', 'master', function(error, result) {

      cliUi.state("git, get files diff, file-names only");
      simpleGit.diff([hashFrom + '..' + hashTo, "--name-only"], function(error, result) {

        let resultGitDiff = result;
        let gitDiffFileList = resultGitDiff.split("\n").filter(function(value){
          return !!value && value.indexOf(".csv") != -1;
        });

        // fix path with folders
        gitDiffFileList.forEach(function(item, index, arr){
          arr[index] = path.parse(item).base;
        });

        cliUi.state("git, get files diff, file-names with states");
        simpleGit.silent(GIT_SILENT).diff([hashFrom + '..' + hashTo, "--name-status"], function(error, result) {

          result.split("\n").filter(function(value) {
            return !!value && value.indexOf(".csv") != -1;
          }).map(function(rawFile) {
            let fileStat = rawFile.split("\t");
            gitDiffFileStatus[fileStat[1]] = fileStat[0];
          });

          cliUi.stop();
          callback(null, gitDiffFileList);

        });
      });
    });
  });

};

gitFlow.prototype.showFileStateByHash = function (data, fileName, callback) {

  let gitRepo = data.github;

  let self = this;
  let gitFolder = this.configDir(gitRepo);

  let gitHashFrom = data.hashFrom + ':' + fileName;
  let gitHashTo = data.hashTo + ':' + fileName;

  async.waterfall(
    [
      function(done) {

        simpleGit.silent(GIT_SILENT).show([gitHashFrom], function(error, result){
          result = !!error ? '' : result;
          return done(null, result);
        });

      },
      function(dataFrom, done) {

        simpleGit.silent(GIT_SILENT).show([gitHashTo], function(error, result){
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

// Export Module

module.exports = new gitFlow();