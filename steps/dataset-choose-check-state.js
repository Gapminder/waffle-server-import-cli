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

const sourceList = require('./../config/repositories');

let question = {
  'name': 'dataset-choose-check-state',
  'type': 'list',
  'message': 'List of DataSet Repositories (github.com)',
  'choices': []
};

// Own Process Implementation

const wsRequest = require('./../service/request-ws');
const gitFlow = require('./../service/git-flow');
const formatter = require('./../service/formatter');

const NEXT_STEP_PATH = 'choose-flow';
const HOLDER_KEY_REPO_LIST = 'repository-list';

step.prototype.preProcess  = function (done) {

  let choices = [];
  let nextStrategy = {};
  let repoList = this.holder.load(HOLDER_KEY_REPO_LIST, []);

  repoList.forEach(function(item){
    choices.push({
      name: item.github,
      value: item.github
    });
    nextStrategy[item.github] = NEXT_STEP_PATH;
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
    'datasetName': gitFlow.getRepoName(inputValue)
  };

  wsRequest.getDatasetState(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.stop().logStart().error(errorMsg).logEnd();
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    let responseData = wsResponse.getData([]);

    let message = [];
    message.push(`> ${responseData.datasetName} : #${responseData.transaction.commit} - ${responseData.transaction.status} `);
    message.push(`(${formatter.date(responseData.transaction.createdAt)})\n`);

    message.push(`  - Concepts: ${responseData.modifiedObjects.concepts}\n`);
    message.push(`  - Entities: ${responseData.modifiedObjects.entities}\n`);
    message.push(`  - Datapoints: ${responseData.modifiedObjects.datapoints}`);

    cliUi.stop().logPrint([message.join("")]);
    done(null, true);
  });

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;