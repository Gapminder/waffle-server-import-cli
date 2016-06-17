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
  let gitFolder = this.getRepoFolder(github);
  simpleGit._baseDir = gitFolder;

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

  let gitFolder = this.getRepoFolder(github);
  simpleGit._baseDir = gitFolder;

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
  let gitFolder = this.getRepoFolder(gitRepo);
  simpleGit._baseDir = gitFolder;

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