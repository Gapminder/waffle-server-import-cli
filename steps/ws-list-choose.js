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
  'name': 'ws-list-choose',
  'type': 'list',
  'message': 'Select Waffle Server Source',
  'choices': []
};

// Own Process Implementation

const NEXT_STEP_PATH = 'authentication-login';
const HOLDER_KEY_WS_LIST = 'waffle-server-list';

step.prototype.preProcess  = function (done) {

  let choices = [];
  let nextStrategy = {};
  let wsList = this.holder.load(HOLDER_KEY_WS_LIST, []);

  wsList.forEach(function(item){
    choices.push({
      name: item.name + " (" + item.url + ")",
      value: item.url
    });
    nextStrategy[item.url] = NEXT_STEP_PATH;
  });

  this.setQuestionChoices(choices, nextStrategy);
  done();
};

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing select waffle server source");

  cliUi.stop();
  done(null, true);
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;