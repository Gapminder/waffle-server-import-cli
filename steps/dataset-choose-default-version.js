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
  'name': 'dataset-choose-default-version',
  'type': 'list',
  'message': 'Choose Default DataSet Version',
  'choices': []
};

// Own Process Implementation

const wsRequest = require('./../service/request-ws');
const formatter = require('./../service/formatter');

step.prototype.preProcess  = function (done) {

  let self = this;

  let datasetSelected = stepInstance.holder.get('dataset-choose-default', '');
  let datasetList = stepInstance.holder.getResult('dataset-list', []);
  let datasetVersions = [];

  datasetList.forEach(function(item){
    if(item.name == datasetSelected) {
      datasetVersions = item.versions;
    }
  });

  let nextStrategy = {};
  let choices = datasetVersions.map(function(item){

    nextStrategy[item.commit] = 'choose-flow';

    let choiceData = {
      name: item.commit + " (" + formatter.date(item.createdAt) + ")",
      value: item.commit
    };

    if(item.isDefault) {
      choiceData['disabled'] = 'default';
    }

    return choiceData;
  });

  self.setQuestionChoices(choices, nextStrategy);
  done();
};


step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing Default Dataset Version");

  // back & exit
  if(!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  let data = {
    'datasetName': stepInstance.holder.get('dataset-choose-default', ''),
    'commit': inputValue
  };

  wsRequest.setDefaultDataSet(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.stop().logStart().error(errorMsg).logEnd();
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    // ToDo :: data response
    
    //let operationMsg = wsResponse.getMessage();
    console.log(wsResponse);
    cliUi.stop().logPrint(["OK"]);

    cliUi.stop();
    return done(null, true);
  });
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;