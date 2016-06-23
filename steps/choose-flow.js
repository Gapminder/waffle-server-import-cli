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
  'name': 'choose-flow',
  'type': 'list',
  'message': 'Choose Flow',
  'default': 0,
  'choices': [
    {
      name: 'Register Repository',
      value: 'register-repository'
    },
    {
      name: 'Import DataSet',
      value: 'dataset-choose-import'
    },
    {
      name: 'Update DataSet',
      value: 'dataset-choose-update'
    },
    {
      name: 'Results Overview',
      value: 'results-overview'
    },
    {
      name: 'Check State',
      value: 'dataset-choose-check-state'
    },
    {
      name: 'RollBack Transaction',
      value: 'dataset-choose-rollback'
    }
  ]
};

// Own Process Implementation

const wsRequest = require('./../service/ws-request');

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

    wsRequest.getPrestoredQueries({}, function(error, wsResponse) {

      let errorMsg = error ? error.toString() : wsResponse.getError();

      if(errorMsg) {
        cliUi.logStart().error(errorMsg).logEnd().stop();
        // return done(errorMsg); :: inquirer bug, update after fix
        return done(null, true);
      }

      let logRows = [];
      let responseData = wsResponse.getData([]);

      responseData.forEach(function(item, index) {
        logRows.push("\n");
        logRows.push("> " + item.datasetName);
        logRows.push("  - version : " + item.version);
        logRows.push("  - date    : " + item.createdAt);
        logRows.push("  - url     : " + item.url);
      });
      logRows.push("\n");

      cliUi.logPrint(logRows).stop();
      done(null, true);
    });

  } else {
      cliUi.stop();
      done(null, true);
  }
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;