'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var inquirer = require('inquirer');

var question = {
  'name': 'flow-import-dataset-update-hash-from',
  'type': 'list',
  'message': 'Git commit, state FROM',
  'choices': []
};

/**************************************************************************************************************/

var holder = require('./../model/value-holder');

step.prototype.process = function (inputValue) {
  var done = this.async();
  done(null, true);
};

// Define Hook

step.prototype.prepare = function () {
  var prevStepResult = holder.getResult('flow-update-dataset-choose', []);
  this.step.choices = prevStepResult;
};

/**************************************************************************************************************/

module.exports = new step(question);
