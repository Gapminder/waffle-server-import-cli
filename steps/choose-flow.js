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
  'name': 'choose-flow',
  'type': 'list',
  'message': 'Choose Flow',
  'choices': [
    'Import Translations',
    'Import DataSet',
    'Publish DataSet',
    new inquirer.Separator(),
    'Exit'
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
