'use strict';

const util = require('util');
const cliUi = require('./../service/cli-ui');
const inquirer = require('inquirer');
const stepBase = require('./../model/base-step');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

let question = {
  'name': 'register-repository',
  'type': 'input',
  'message': 'Register Repository'
};

// Own Process Implementation

const _ = require('lodash');
const fs = require('fs');
const path = require("path");

const CONFIG_FILE_REPOS = path.resolve(__dirname, "./../config/repositories.json");
const HOLDER_KEY_REPO_LIST = 'repository-list';

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("register repository");

  inputValue = _.trim(inputValue);
  let repoList = stepInstance.holder.load(HOLDER_KEY_REPO_LIST, []);

  let githubUrl = inputValue;
  let regexpFolder = /\/(.+)\.git/;
  let regexpFolderRes = regexpFolder.exec(githubUrl);

  if(!regexpFolderRes) {
    cliUi.stop();
    return done(null, "Invalid repo URL");
  }

  let gitFolder = regexpFolderRes[1];
  let repoNew = {
    github: inputValue,
    folder: gitFolder
  };

  // Save Added :: change it to WS route

  let reposJsonRaw = fs.readFileSync(CONFIG_FILE_REPOS);
  let reposJson = JSON.parse(reposJsonRaw);

  let repoExists = _.find(reposJson, function(item) {
    return item.github == inputValue;
  });

  if(!repoExists) {

    repoList.push(repoNew);
    stepInstance.holder.save(HOLDER_KEY_REPO_LIST, repoList);

    reposJson.push(repoNew);
    fs.writeFileSync(CONFIG_FILE_REPOS, JSON.stringify(reposJson));
  }

  cliUi.stop();
  done(null, true);

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;