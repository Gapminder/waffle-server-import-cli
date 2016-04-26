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
  'name': 'exit',
  'type': 'list',
  'message': 'Keep working with Tool',
  'choices': [
    'Yes, Another Action',
    'No, Exit'
  ]
};

/**************************************************************************************************************/

step.prototype.process = function (inputValue) {
  var done = this.async();
  setTimeout(function () {
    done(null, true);
  }, 100);
};

/**************************************************************************************************************/

module.exports = new step(question);
