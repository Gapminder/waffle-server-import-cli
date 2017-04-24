'use strict';

const util = require('util');
const cliUi = require('./../service/cli-ui');
const inquirer = require('inquirer');
const stepBase = require('./../model/base-step');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

let separator = new inquirer.Separator();

let question = {
  'name': 'choose-flow',
  'type': 'list',
  'message': 'Choose Flow',
  'default': 0,
  'choices': [
    {
      name: 'List datasets and versions',
      value: 'results-overview'
    },
    {
      name: 'Register Repository',
      value: 'register-repository'
    },
    //separator,
    {
      name: 'Import DataSet',
      value: 'dataset-choose-import'
    },
    {
      name: 'Update DataSet',
      value: 'dataset-choose-update'
    },
    {
      name: 'RollBack Transaction',
      value: 'dataset-choose-rollback'
    },
    {
      name: 'Remove Dataset',
      value: 'dataset-choose-remove'
    },
    {
      name: 'Clean Repos (CLI + WS)',
      value: 'dataset-choose-clean-repos'
    },
    //separator,
    {
      name: 'Check State',
      value: 'dataset-choose-check-state'
    },
    {
      name: 'Default DataSet',
      value: 'dataset-choose-default'
    },
    {
      name: 'Generate Access Token',
      value: 'generate-access-token'
    },
    {
      name: 'Reconnect (Import/Update)',
      value: 'reconnect-import-update'
    },
    {
      name: 'Invalidate Cache',
      value: 'cache-clean'
    }
  ]
};

// Own Process Implementation

const wsRequest = require('./../service/request-ws');
const formatter = require('./../service/formatter');
const stepsUtils = require('./steps-utils');

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing user choice");

  // back & exit
  if(!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  /*
    inquirer :: issue

    Question type `list`, could not return not TRUE (means, error message) in async mode
    https://github.com/strongloop/loopback/issues/2292

  */

  if (inputValue == 'results-overview') {

    return stepsUtils.getPrestoredQueries(done);

  } else if (inputValue == 'cache-clean') {

    return stepsUtils.cacheClean(done);

  } else if (inputValue === 'dataset-choose-clean-repos') {

    return stepsUtils.reposClean(done);
  }

  cliUi.stop();
  return done(null, true);
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;