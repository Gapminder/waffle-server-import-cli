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
  'name': 'authentication-login',
  'type': 'input',
  'default': 'dev@gapminder.org',
  'message': 'Authentication, Login'
};

// Own Process Implementation

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing user login");

  // START implement :: authentication check login

  /*
    if(inputValue != 'test') {
      cliUi.stop();
      return done(null, false);
    }
  */

  // END implement :: authentication check login

  cliUi.stop();
  return done(null, true);
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;
