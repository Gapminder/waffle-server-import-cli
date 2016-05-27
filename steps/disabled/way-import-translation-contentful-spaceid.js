'use strict';

const stepBase = require('./../../model/base-step');
const util = require('util');
const cliProgress = require('./../../service/ui-progress');
const inquirer = require('inquirer');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

let question = {
  'name': 'way-import-translation-contentful-spaceid',
  'type': 'input',
  'default': 'xxx',
  'message': 'Contentful asks for "SPACE_ID"'
};

// Own Process Implementation

step.prototype.process = function (inputValue) {
  var done = this.async();
  setTimeout(function () {
    done(null, true);
  }, 100);
};

// Export Module

module.exports = new step(question);
