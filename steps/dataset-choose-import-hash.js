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
  'name': 'dataset-choose-import-hash',
  'type': 'list',
  'message': 'List of Available Commits',
  'choices': []
};

// Own Process Implementation

const wsRequest = require('./../service/ws-request');
const gitFlow = require('./../service/git-flow');
const longPolling = require('./../service/long-polling');

step.prototype.preProcess  = function (done) {

  let self = this;
  let selectedDataSet = this.holder.get('dataset-choose-import', '');

  gitFlow.getCommitList(selectedDataSet, function(error, list) {

    if(!error) {

      list.reverse();

      let nextStrategy = {};
      let choices = list.map(function(item){
        nextStrategy[item.hash] = 'choose-flow';
        return {
          name: [item.hash, item.message].join(" "),
          value: item.hash
        };
      });
      self.setQuestionChoices(choices, nextStrategy);
      done(null, true);

    } else {
      // error
      self.setQuestionChoices(choices, nextStrategy);
      done("Get Commit List Failed");
    }
  });
};


step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing Import Dataset, send request");

  // back & exit
  if(!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  let data = {
    'github': stepInstance.holder.get('dataset-choose-import', false),
    'commit': inputValue
  };

  gitFlow.validateDataset(data, function(error) {

    if(error) {
      cliUi.stop().logPrint(error);
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    wsRequest.importDataset(data, function(error, wsResponse) {

      let errorMsg = error ? error.toString() : wsResponse.getError();

      if(errorMsg) {
        cliUi.stop().logStart().error(errorMsg).logEnd();
        // return done(errorMsg); :: inquirer bug, update after fix
        return done(null, true);
      }

      let dataState = {
        'datasetName': gitFlow.getRepoName(data.github)
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

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;