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
  'name': 'dataset-choose-update-hash',
  'type': 'list',
  'message': 'Choose Commit "To" (range for update)',
  'choices': []
};

// Own Process Implementation

const wsRequest = require('./../service/ws-request');
const gitFlow = require('./../service/git-flow');
const csvDiff = require('./../service/csv-diff');

step.prototype.preProcess  = function (done) {

  let self = this;
  cliUi.state("get latest update hash commit from Waffle-Server");

  let data = {
    'github': this.holder.get('dataset-choose-update', false)
  };

  wsRequest.getLatestCommit(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.logStart().error(errorMsg).logEnd().stop();
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    let responseData = wsResponse.getData();

    // get commit list

    self.holder.setResult('dataset-update-data', responseData);

    let selectedDataSet = responseData.github;
    let commitFrom = gitFlow.getShortHash(responseData.commit);

    gitFlow.getCommitList(selectedDataSet, function(error, list) {
      if(!error) {

        list.reverse();

        let commitFromIndex = list.findIndex(function(item) {
          return item.hash == commitFrom;
        });

        let nextStrategy = {};
        let choices = list.map(function(item, index){
          nextStrategy[item.hash] = 'choose-flow';
          let choiceData = {
            name: [item.hash, item.message].join(" "),
            value: item.hash
          };
          if(index < commitFromIndex) {
            choiceData['disabled'] = 'unavailable';
          }
          if(index == commitFromIndex) {
            choiceData['disabled'] = 'FROM';
          }
          return choiceData;
        });
        self.setQuestionChoices(choices, nextStrategy);
        done();
      } else {
        // error
        done("Get Commit List Failed");
      }
    });
  });
};


step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing Update Dataset");

  // back & exit
  if(!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  let datasetData = stepInstance.holder.getResult('dataset-update-data');
  let commitFrom = gitFlow.getShortHash(datasetData.commit);

  csvDiff.process({
    'hashFrom': commitFrom,
    'hashTo': inputValue,
    'github': datasetData.github
  }, function(error, result) {

    let data = {
      'diff': result,
      'github': datasetData.github,
      'commit': inputValue
    };

    cliUi.state("processing Update Dataset, send request");

    wsRequest.updateDataset(data, function(error, wsResponse) {

      let errorMsg = error ? error.toString() : wsResponse.getError();

      if(errorMsg) {
        cliUi.logStart().error(errorMsg).logEnd().stop();
        // return done(errorMsg); :: inquirer bug, update after fix
        return done(null, true);
      }

      let operationMsg = wsResponse.getMessage();
      cliUi.logPrint([operationMsg]).stop();

      return done(null, true);
    });

  });

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;