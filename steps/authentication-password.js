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

let question = {
  'name': 'authentication-password',
  'type': 'password',
  'default': 'test',
  'message': 'Authentication, Password'
};

// Own Process Implementation

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing user password");

  // START implement :: authentication check login + password

  if(inputValue != 'test') { cliUi.stop(); return done(null, false); }

  // END implement :: authentication check login + password

  cliUi.stop();
  done(null, true);  
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;