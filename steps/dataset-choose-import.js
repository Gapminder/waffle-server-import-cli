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
  'name': 'dataset-choose-import',
  'type': 'list',
  'message': `List of DataSet Repositories (github.com, ${cliUi.CONST_FONT_BLUE}was loaded from local 'config/repositories.json'${cliUi.CONST_FONT_WHITE})`,
  'choices': []
};

// Own Process Implementation

const NEXT_STEP_PATH = 'dataset-choose-repo-type';
const HOLDER_KEY_REPO_LIST = 'repository-list';

step.prototype.preProcess  = function (done) {

  let choices = [];
  let nextStrategy = {};
  let repoList = this.holder.load(HOLDER_KEY_REPO_LIST, []);

  repoList.forEach(function(item){
    choices.push({
      name: item.github,
      value: item.github
    });
    nextStrategy[item.github] = NEXT_STEP_PATH;
  });

  this.setQuestionChoices(choices, nextStrategy);
  done();
};

step.prototype.process = function (inputValue) {
  
  cliUi.resetTime(false);
  let done = this.async();
  cliUi.state("processing selected repo for import");

  cliUi.stop();
  done(null, true);
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;