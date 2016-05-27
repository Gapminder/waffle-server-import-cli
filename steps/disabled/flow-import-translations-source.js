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
  'name': 'flow-import-translations-source',
  'type': 'list',
  'message': 'Import source',
  'choices': [
    '[external] contentful.com',
    '[internal] file system',
    new inquirer.Separator(),
    'Back'
  ]
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
