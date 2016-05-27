'use strict';

const stepBase = require('./../model/base-step');
const util = require('util');
const cliProgress = require('./../service/ui-progress');
const inquirer = require('inquirer');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

let question = {
  'name': 'exit',
  'type': 'list',
  'message': 'Keep working with Tool',
  'choices': [
    'Yes, Another Action',
    'No, Exit'
  ]
};

// Own Process Implementation

step.prototype.process = function (inputValue) {
  
  let done = this.async();
  cliProgress.state("processing exit");
  
  setTimeout(function () {
    cliProgress.stop();
    done(null, true);
  }, 100);
};

// Export Module

module.exports = new step(question);
