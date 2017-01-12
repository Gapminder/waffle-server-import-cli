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
  'name': 'generate-access-token',
  'type': 'list',
  'message': 'Choose DataSet from the List of Repositories (github.com)',
  'choices': []
};

// Own Process Implementation

const NEXT_STEP_PATH = 'choose-flow';
const HOLDER_KEY_REPO_LIST = 'repository-list';

const wsRequest = require('./../service/request-ws');
const gitFlow = require('./../service/git-flow');

step.prototype.preProcess  = function (done) {

  const self = this;
  const data = {};

  wsRequest.privateDatasetList(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      // error
      self.setQuestionChoices(choices, nextStrategy);
      cliUi.stop().error(errorMsg);
      return done(null, false);
    }

    const responseData = wsResponse.getData([]);

    const choices = [];
    const nextStrategy = {};

    if(!responseData.length) {
      cliUi.stop().warning("There is no available private Datasets");
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
  cliUi.state("processing generation of access token");

  // back & exit
  if(!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  const data = {
    'datasetName': gitFlow.getRepoName(inputValue)
  };

  wsRequest.getAccessToken(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.stop().logStart().error(errorMsg).logEnd();
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    let responseData = wsResponse.getData();
    const message = `Generated Access Token :: ${responseData.accessToken}`;

    cliUi.stop().logPrint([message]);
    done(null, true);
  });
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;