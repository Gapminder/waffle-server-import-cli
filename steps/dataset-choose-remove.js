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

let question = {
  'name': 'dataset-choose-remove',
  'type': 'list',
  'message': 'List of DataSet Repositories (github.com)',
  'choices': []
};

// Own Process Implementation

const wsRequest = require('./../service/request-ws');
const gitFlow = require('./../service/git-flow');

const NEXT_STEP_PATH = 'choose-flow';

step.prototype.preProcess  = function (done) {

  const self = this;
  const choices = [];
  const nextStrategy = {};
  const data = {};

  wsRequest.removableDatasetList(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      // error
      self.setQuestionChoices(choices, nextStrategy);
      cliUi.stop().error(errorMsg);
      return done(null, false);
    }

    const responseData = wsResponse.getData([]);

    if(!responseData.length) {
      cliUi.stop().warning("There is no available Datasets for remove");
    }

    responseData.forEach(function(item){
      choices.push({
        name: item.githubUrl,
        value: item.githubUrl
      });
      nextStrategy[item.githubUrl] = NEXT_STEP_PATH;
    });

    self.setQuestionChoices(choices, nextStrategy);
    done();
  });
};

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing selected repo for removing dataset");

  // back & exit
  if(!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  // REQUEST

  let data = {
    'datasetName': gitFlow.getRepoName(inputValue)
  };

  wsRequest.removeDataset(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.stop().logStart().error(errorMsg).logEnd();
      return done(null, true);
    }

    let operationMsg = wsResponse.getMessage();
    cliUi.stop().logPrint([operationMsg]);

    done(null, true);
  });

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;