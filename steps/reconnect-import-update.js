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
  'name': 'reconnect-import-update',
  'type': 'list',
  'message': 'List of DataSets in progress',
  'choices': []
};

// Own Process Implementation

const wsRequest = require('./../service/request-ws');
const gitFlow = require('./../service/git-flow');
const longPolling = require('./../service/request-polling');
const shell = require('shelljs');

const NEXT_STEP_PATH = 'choose-flow';

step.prototype.preProcess  = function (done) {

  const self = this;
  const choices = [];
  const nextStrategy = {};
  const data = {};

  wsRequest.getDatasetsInProgress(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      // error
      self.setQuestionChoices(choices, nextStrategy);
      cliUi.stop().error(errorMsg);
      return done(null, false);
    }

    const responseData = wsResponse.getData([]);

    if(!responseData.length) {
      cliUi.stop().warning("There are no available Datasets in Progress");
    }

    responseData.forEach(function(item){
      choices.push({
        name: item.name,
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
  cliUi.state("processing, connect to dataset in progress");

  // back & exit
  if (!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  let gitRepoPath = gitFlow.getRepoFolder(inputValue);
  let commandLinesOfCode = `wc -l ${gitRepoPath}/*.csv | grep "total$"`;

  shell.exec(commandLinesOfCode, {silent: true}, function (err, stdout) {

    let numberOfRows = parseInt(stdout);
    let dataState = {
      'datasetName': gitFlow.getRepoName(inputValue)
    };

    longPolling.setTimeStart(numberOfRows);
    longPolling.checkDataSet(dataState, function (state) {
      // state.success
      if (!state.success) {
        cliUi.stop().logStart().error(state.message).logEnd();
      } else {
        cliUi.stop().logPrint([state.message]);
      }
      return done(null, true);
    });
  });

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;