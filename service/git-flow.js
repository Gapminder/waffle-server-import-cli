'use strict';

const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const async = require("async");
const cliUi = require('./../service/cli-ui');

let sourceFolder = fs.realpathSync('./');
let sourceFolderPath = sourceFolder + '/repos/';

const simpleGit = require('simple-git')();
const debugGitSilent = true;

function gitFlow() {
  if(!fs.existsSync(sourceFolderPath)) {
    fs.mkdirSync(sourceFolderPath);
  }
};


gitFlow.prototype.getShortHash = function (commit) {
  return !!commit ? commit.substring(0, 8) : '';
};

gitFlow.prototype.configDir = function (github) {
  let gitFolder = this.getRepoFolder(github);
  simpleGit._baseDir = gitFolder;
  return gitFolder;
};



gitFlow.prototype.getRepoFolder = function (github) {
  let regexpFolder = /\/(.+)\.git/;
  let regexpFolderRes = regexpFolder.exec(github);
  let regexpFolderGitFolder = regexpFolderRes[1] || false;
  if(!regexpFolderGitFolder) {
    return regexpFolderGitFolder;
  }
  return sourceFolderPath + regexpFolderGitFolder;
};

gitFlow.prototype.getCommitList = function (github, callback) {

  let self = this;
  let gitFolder = this.configDir(github);

  cliUi.state("git, get commit list, clone repo");
  simpleGit.silent(true).clone(github, gitFolder, function(error, result){

    cliUi.state("git, get commit list, download updates");
    simpleGit.silent(true).pull('origin', 'master', function(error, result){

      cliUi.state("git, get commit list, process log");
      simpleGit.silent(true).log(function(error, result){

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
  simpleGit.silent(true).clone(github, gitFolder, function(error, result){

    cliUi.state("git, get files diff, download updates");
    simpleGit.silent(true).pull('origin', 'master', function(error, result) {

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
        simpleGit.diff([hashFrom + '..' + hashTo, "--name-status"], function(error, result) {

          let resultGitDiffByFiles = result;

          resultGitDiffByFiles.split("\n").filter(function(value) {
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

  let gitHashFrom = data.hashFrom;
  let gitHashTo = data.hashTo;
  let gitRepo = data.github;

  let self = this;
  this.configDir(gitRepo);

  let gitDir = '--git-dir=' + gitFolder + '/.git';

  let commandGitShowFrom = 'git ' + gitDir + ' show ' + gitHashFrom + ':' + fileName;
  let commandGitShowTo = 'git ' + gitDir + ' show ' + gitHashTo + ':' + fileName;

  async.waterfall(
    [
      function(done) {

        let csvFrom = [];
        return shelljs.exec(commandGitShowFrom, {silent: debugGitSilent, async: true}).stdout.on("data", function(dataFrom) {
          csvFrom.push(dataFrom);
        })
          .on('end', function() {
            cliUi.state("generate diff, data from ready");
            return done(null, csvFrom.join(""));
          });
      },
      function(dataFrom, done) {

        let csvTo = [];
        return shelljs.exec(commandGitShowTo, {silent: debugGitSilent, async: true}).stdout.on("data", function(dataTo) {
          csvTo.push(dataTo);
        }).on("end", function() {
          cliUi.state("generate diff, data to ready");
          return done(null, {from: dataFrom, to: csvTo.join("")});
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