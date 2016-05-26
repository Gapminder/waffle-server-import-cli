'use strict';

let stepBase = require('./../model/base-step');
let util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

let inquirer = require('inquirer');

let question = {
  'name': 'flow-import-dataset-update-hash-from',
  'type': 'list',
  'message': 'Git commit, state FROM',
  'choices': []
};

/**************************************************************************************************************/

let holder = require('./../model/value-holder');

step.prototype.process = function (inputValue) {
  let done = this.async();
  done(null, true);
};

// Define Hook

step.prototype.prepare = function () {
  let prevStepResult = holder.getResult('flow-update-dataset-choose', []);
  //let filteredArray = prevStepResult.slice();
  let filteredArray = JSON.parse(JSON.stringify(prevStepResult));

  // disable first (means last commit)
  filteredArray[0]['disabled'] = "unavailable";

  this.step.choices = filteredArray;
};

/**************************************************************************************************************/

module.exports = new step(question);
