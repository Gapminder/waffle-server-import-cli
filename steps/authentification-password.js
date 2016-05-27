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
  'name': 'authentification-password',
  'type': 'password',
  'default': 'test',
  'message': 'Authentification, Password'
};

// Own Process Implementation

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliProgress.state("processing user password");

  setTimeout(function () {
    if(inputValue == 'test') {
      cliProgress.stop();
      done(null, true);
    } else {
      cliProgress.stop();
      done(null, false);
    }
  }, 100);
};

// Export Module

module.exports = new step(question);
