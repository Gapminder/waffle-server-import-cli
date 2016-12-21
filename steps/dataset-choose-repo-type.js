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
  'name': 'dataset-choose-repo-type',
  'type': 'list',
  'message': 'Repo Type',
  'default': 0,
  'choices': [
    {
      name: 'Public',
      value: 'public'
    },
    {
      name: 'Private',
      value: 'private'
    }
  ]
};

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing choice of repo type");

  // back & exit
  if(!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  // default :: goes to next step
  cliUi.stop();
  done(null, true);
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;