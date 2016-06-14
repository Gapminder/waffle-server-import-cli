'use strict';

const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const cliUi = require('./../service/cli-ui');

let sourceFolder = fs.realpathSync('./');
let sourceFolderPath = sourceFolder + '/repos/';

const debugGitSilent = true;

function gitFlow() {
  if(!fs.existsSync(sourceFolderPath)) {
    fs.mkdirSync(sourceFolderPath);
  }
};


gitFlow.prototype.getShortHash = function (commit) {
  return !!commit ? commit.substring(0, 8) : '';
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

  let gitFolder = this.getRepoFolder(github);
  let execGitClone = "git clone " + github + " " + gitFolder;
  cliUi.state("git, get commit list, clone repo");
  shelljs.exec(execGitClone, {silent: debugGitSilent, async: true}, function(error, stdout, stderr) {

    let gitDir = '--git-dir=' + gitFolder + '/.git';
    let execGitPull = "git " + gitDir + " pull origin master";
    cliUi.state("git, get commit list, download updates");
    shelljs.exec(execGitPull, {silent: debugGitSilent, async: true}, function(error, stdout, stderr) {

      let execGitLog = "git " + gitDir + " log --all --oneline";
      cliUi.state("git, get commit list, process log");
      shelljs.exec(execGitLog, {silent: debugGitSilent, async: true}, function(error, stdout, stderr) {

        let commits = stdout.split("\n");
        let commitsList = commits.filter(function(item){
          return !!item.length;
        }).map(function(item){
          let data = item.split(" ");
          return {
            hash: data.shift(),
            message: data.join(" ")
          };
        });

        cliUi.stop();
        callback(false, commitsList);
      });
    });
  });
};

gitFlow.prototype.getFileDiffByHashes = function (data, callback) {

  let github = data.github;
  let hashFrom = data.hashFrom;
  let hashTo = data.hashTo;

  let gitFolder = this.getRepoFolder(github);
  let execGitClone = "git clone " + github + " " + gitFolder;
  cliUi.state("git, get files diff, clone repo");
  shelljs.exec(execGitClone, {silent: debugGitSilent, async: true}, function(error, stdout, stderr) {

    let gitDir = '--git-dir=' + gitFolder + '/.git';
    let execGitPull = "git " + gitDir + " pull origin master";
    cliUi.state("git, get files diff, download updates");
    shelljs.exec(execGitPull, {silent: debugGitSilent, async: true}, function(error, stdout, stderr) {

      let commandGitDiff = 'git ' + gitDir + ' diff ' + hashFrom + '..' + hashTo + ' --name-only';
      cliUi.state("git, get files diff, file-names only");
      shelljs.exec(commandGitDiff, {silent: debugGitSilent, async: true}, function(error, stdout, stderr) {

        if(!!stderr) {
          cliUi.error("git, get files diff, filenames only", stderr.toString());
          return callback();
        }

        let resultGitDiff = stdout;
        let gitDiffFileList = resultGitDiff.split("\n").filter(function(value){
          return !!value && value.indexOf(".csv") != -1;
        });

        // fix path with folders
        gitDiffFileList.forEach(function(item, index, arr){
          let filepath = path.parse(item);
          arr[index] = filepath.base;
        });

        let commandGitDiffByFiles = 'git ' + gitDir + ' diff ' + hashFrom + '..' + hashTo + ' --name-status';
        cliUi.state("git, get files diff, file-names with states");
        shelljs.exec(commandGitDiffByFiles, {silent: debugGitSilent, async: true}, function(error, stdout, stderr) {

          let resultGitDiffByFiles = stdout;
          let gitDiffFileStatus = {};

          resultGitDiffByFiles.split("\n").filter(function(value) {
            return !!value && value.indexOf(".csv") != -1;
          }).map(function(rawFile) {
            let fileStat = rawFile.split("\t");
            gitDiffFileStatus[fileStat[1]] = fileStat[0];
          });

          cliUi.stop();
          callback(null, gitDiffFileList, gitDiffFileStatus);
        });
      });

    });
  });
};

// Export Module

module.exports = new gitFlow();