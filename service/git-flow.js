'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const hi = require('highland');
const async = require("async");
const shell = require("shelljs");
const JSONStream = require('JSONStream');
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

  shell.exec(`ssh -T git@github.com`, {silent: true}, (code, stdout, stderr) => {
    if (code > 1) {
      shell.echo(`${cliUi.CONST_FONT_RED}* [code=${code}] ERROR: ${cliUi.CONST_FONT_YELLOW}${stderr}${cliUi.CONST_FONT_BLUE}\n\tPlease, follow the detailed instruction 'https://github.com/Gapminder/waffle-server-import-cli#ssh-key' for continue working with CLI tool.${cliUi.CONST_FONT_WHITE}`);
      shell.exit(0);
    }

    gitw(gitFolder).clone(githubUrlDescriptor.url, gitFolder, ['-b', githubUrlDescriptor.branch], function(error, result){

      if(error) {
        return callback(error);
      }

      cliUi.state("git, download updates");

      gitw(gitFolder).fetch('origin', githubUrlDescriptor.branch, function(error, result){

        if(error) {
          return callback(error);
        }

        cliUi.state("git, checkout on last changes");

        gitw(gitFolder).reset(['--hard', 'origin/' + githubUrlDescriptor.branch], function(error, result){

          if(error) {
            return callback(error);
          }

          return callback();
        });
      });
    });
  });

};

gitFlow.prototype.getCommitList = function (github, callback) {

  let self = this;
  let gitFolder = this.configDir(github);
  var githubUrlDescriptor = getGithubUrlDescriptor(github);

  this.registerRepo(github, function(){

    cliUi.state("git, process log");

    gitw(gitFolder).fetch('origin', githubUrlDescriptor.branch, function(error, result) {

      if (error) {
        return callback(error);
      }

      cliUi.state("git, download updates");

      gitw(gitFolder).reset(['--hard', 'origin/' + githubUrlDescriptor.branch], function (error, result) {

        if (error) {
          return callback(error);
        }

        cliUi.state("git, checkout on last changes");

        gitw(gitFolder).log(function (error, result) {

          if (error) {
            return callback(error);
          }

          let commits = result.all;
          let commitsList = commits.map(function (item) {
            return {
              hash: self.getShortHash(item.hash),
              message: item.message,
              date: item.date
            };
          });

          return callback(false, commitsList);
        });
      });
    });
  });
};

function getFileNamesDiff(context, done) {
  cliUi.state("git, get diff, file-names only");

  const {gitFolder, hashFrom, hashTo} = context;

  return gitw(gitFolder).diff([hashFrom + '..' + hashTo, "--name-only"], (error, resultGitDiff) => {
    if (error) {
      return done(error);
    }

    context.gitDiffFileList = _.chain(resultGitDiff)
      .split('\n')
      .filter(value => !!value && value.indexOf(".csv") != -1)
      .value();

    return done(null, context);
  })
}

function getFileStatusesDiff(context, done) {
  cliUi.state("git, get diff, file-names with states");

  const {gitFolder, hashFrom, hashTo} = context;

  return gitw(gitFolder).diff([hashFrom + '..' + hashTo, "--name-status"], function(error, resultGitDiff) {
    if (error) {
      return done(error);
    }

    context.gitDiffFileStatus = _.chain(resultGitDiff)
      .split('\n')
      .reduce((result, rawFile) => {

        if (!!rawFile && rawFile.indexOf(".csv") != -1) {
          const fileStat = rawFile.split("\t");
          result[_.last(fileStat)] = _.first(fileStat);
        }

        return result;
      }, {})
      .value();

    return done(null, context);
  });
}

function checkoutHash(hash, context, done) {
  const {gitFolder} = context;

  gitw(gitFolder).checkout(hash, function(error) {
    if (error) {
      return done(error);
    }

    return done(null, context);
  });
}

function readJsonFileAsJsonStream(pathToFile) {
  const fileWithChangesStream = fs.createReadStream(pathToFile, {encoding: 'utf8'});
  const jsonStream = fileWithChangesStream.pipe(JSONStream.parse());
  return hi(jsonStream);
}

function getDatapackage(propertyName, context, done) {
  const datapackagePath = context.gitFolder + 'datapackage.json';

  if (fs.existsSync(datapackagePath)) {
    return readJsonFileAsJsonStream(datapackagePath)
      .toCallback((error, datapackageContent) => {

        if (error) {
          return done(error);
        }

        context.metadata[propertyName] = datapackageContent;

        return done(null, context);
      });
  }

  return async.setImmediate(() => done('`datapackage.json` is absent'));
}

gitFlow.prototype.getFileDiffByHashes = function (externalContext, callback) {

  const self = this;
  const gitFolder = self.configDir(externalContext.github);

  const metadata = {
    datapackageOld: {},
    datapackageNew: {}
  };

  const context = _.extend({gitFolder, gitDiffFileStatus: [], gitDiffFileList: [], metadata}, externalContext);

  return async.waterfall([
    async.constant(context),
    (context, done) => self.registerRepo(context.github, (error) => {
      if (error) {
        console.error(error);
      }

      return done(null, context);
    }),
    getFileNamesDiff,
    getFileStatusesDiff,
    async.apply(checkoutHash, externalContext.hashFrom),
    async.apply(getDatapackage, 'datapackageOld'),
    async.apply(checkoutHash, externalContext.hashTo),
    async.apply(getDatapackage, 'datapackageNew')
  ], (error, result) => {
    if (error) {
      return callback(error);
    }

    const {gitDiffFileList, metadata, gitDiffFileStatus} = result;

    return callback(null, {gitDiffFileList, metadata, gitDiffFileStatus});
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
      excludeRules: 'WRONG_DATA_POINT_HEADER',
      excludeDirs: '.gitingore .git',
      isCheckHidden: true
    });

    let issues = [];

    streamValidator.on('issue', function(issue) {
      issues.push(issue);
    });

    streamValidator.on('finish', function(err) {
      if(issues.length) {
        cliUi.stop().error("* Validation Error!");
        return callback(issues);
      }
      cliUi.stop().success("* Validation completed!");
      return callback(null);
    });

    ddfValidation.validate(streamValidator);
  });

};

gitFlow.prototype.getDiffFileNameResult = function (pathFolder, github, additional) {
  const filePath = getGithubUrlDescriptor(github);

  const filePartsResult = [];
  filePartsResult.push('result');
  filePartsResult.push(filePath.account);
  filePartsResult.push(filePath.repo);
  filePartsResult.push(filePath.branch);

  if(additional) {
    filePartsResult.push(additional);
  }

  filePartsResult.push('output.txt');
  return path.resolve(pathFolder, filePartsResult.join("--"));
};

function getGithubUrlDescriptor(githubUrl) {
  const regexpFolderRes = /:(.+)\/(.+)\.git(#(.+))?/.exec(githubUrl);

  return {
    account: regexpFolderRes[1] || '',
    repo: regexpFolderRes[2] || '',
    branch: regexpFolderRes[4] || 'master',
    url: _.first(_.split(githubUrl, "#"))
  }
}
// Export Module

module.exports = new gitFlow();