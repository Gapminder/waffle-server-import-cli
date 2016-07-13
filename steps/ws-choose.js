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
  'name': 'ws-choose',
  'type': 'list',
  'message': 'Waffle Server Endpoint',
  'default': 0,
  'choices': [
    {
      name: 'Select from the List',
      value: 'ws-list-choose'
    },
    {
      name: 'Add new Endpoint',
      value: 'ws-list-add'
    }
  ]
};

// Own Process Implementation

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing waffle server endpoint");

  cliUi.stop();
  done(null, true);
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;