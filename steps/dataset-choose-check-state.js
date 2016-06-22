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

const sourceList = require('./../config/repositories');

let question = {
  'name': 'dataset-choose-check-state',
  'type': 'list',
  'message': 'List of DataSet Repositories (github.com)',
  'choices': []
};

// Own Process Implementation

const wsRequest = require('./../service/ws-request');

step.prototype.preProcess  = function (done) {

  let choices = [];
  let nextStrategy = {};
  let repoList = this.holder.getResult('repository-list', []);

  repoList.forEach(function(item){
    choices.push({
      name: item.github,
      value: item.github
    });
    nextStrategy[item.github] = 'choose-flow';
  });

  this.setQuestionChoices(choices, nextStrategy);
  done();
};

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing selected repo for check state");

  // back & exit
  if(!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  // REQUEST

  let data = {
    'datasetName': inputValue
  };

  wsRequest.getDatasetState(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.logStart().error(errorMsg).logEnd().stop();
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    let responseData = wsResponse.getData([]);

    let message = responseData.datasetName + ": #" + responseData.transaction.commit + " - ";
    message += responseData.transaction.status + ", (" + responseData.transaction.createdAt + ")";

    cliUi.logPrint(message).stop();
    done(null, true);
  });

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;