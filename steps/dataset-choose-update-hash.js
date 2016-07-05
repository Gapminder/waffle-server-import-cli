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

const wsRequest = require('./../service/request-ws');
const gitFlow = require('./../service/git-flow');
const csvDiff = require('./../service/csv-diff');
const longPolling = require('./../service/request-polling');

step.prototype.preProcess  = function (done) {

  let self = this;
  cliUi.state("get latest update hash commit from Waffle-Server");

  let data = {
    'github': this.holder.get('dataset-choose-update', false)
  };

  wsRequest.getLatestCommit(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      self.setQuestionChoices([], []);
      cliUi.stop().logStart().error(errorMsg).logEnd();
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
        cliUi.stop();
        return done();

      } else {
        // error
        self.setQuestionChoices(choices, nextStrategy);
        cliUi.stop();
        return done("Get Commit List Failed");
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

    gitFlow.validateDataset(data, function(error) {

      if(error) {

        error.forEach(function(index, item, array){
          let fileName = item.path;

          let message = [];
          message.push("TYPE: ");
          message.push(item.type);
          message.push("; ");
          message.push("FILE: ");
          message.push(fileName);
          message.push("; ");
          message.push("DATA: ");
          message.push();
          message.push();

          array[index] = message.join("");
        });

        cliUi.stop().logStart().error("ValidationError").logEnd().logPrint(error);
        // return done(errorMsg); :: inquirer bug, update after fix
        return done(null, true);
      }

      wsRequest.updateDataset(data, function(error, wsResponse) {

        let errorMsg = error ? error.toString() : wsResponse.getError();

        if(errorMsg) {
          cliUi.stop().logStart().error(errorMsg).logEnd();
          // return done(errorMsg); :: inquirer bug, update after fix
          return done(null, true);
        }

        let operationMsg = wsResponse.getMessage();

        let dataState = {
          'datasetName': gitFlow.getRepoName(datasetData.github)
        };

        longPolling.checkDataSet(dataState, function(state){

          // state.success
          if(!state.success) {
            cliUi.stop().logStart().error(state.message).logEnd();
          } else {
            cliUi.stop().logPrint([state.message]);
          }
          return done(null, true);
        });

      });

    });

  });

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;