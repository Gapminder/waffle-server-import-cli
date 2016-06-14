'use strict';

const stepBase = require('./../model/base-step');
const util = require('util');
const cliUi = require('./../service/cli-ui');
const inquirer = require('inquirer');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

const sourceList = require('./../config/repositories');

let question = {
  'name': 'dataset-choose-update',
  'type': 'list',
  'message': 'List of DataSet Repositories (github.com)',
  'choices': []
};

// Own Process Implementation

const request = require('request-defaults');
const _ = require('lodash');
require('shelljs/global');

step.prototype.preProcess  = function (done) {

  let choices = [];
  let nextStrategy = {};
  let repoList = this.holder.getResult('repository-list', []);

  repoList.forEach(function(item){
    choices.push({
      name: item.github,
      value: item.github
    });
    nextStrategy[item.github] = 'dataset-choose-update-hash';
  });

  this.setQuestionChoices(choices, nextStrategy);
  done();
};

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing selected repo for update");
  cliUi.stop();
  done(null, true);

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;