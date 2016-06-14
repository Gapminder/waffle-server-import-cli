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

step.prototype.preProcess  = function (done) {

  let self = this;
  let selectedDataSet = this.holder.get('dataset-choose-import', '');
  gitFlow.getCommitList(selectedDataSet, function(error, list) {
    if(!error) {

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
      done("Get Commit List Failed");
    }
  });
};


step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing Import Dataset, send request");

  let data = {
    'github': stepInstance.holder.get('dataset-choose-import', false),
    'commit': inputValue
  };

  wsRequest.importDataset(data, function(error, response, body) {

    if(error) {
      cliUi.stop();
      return done(null, true);
      // inquirer, bug
      return done(error.toString());
    }

    console.log("connection OK");
    cliUi.stop();
    return done(null, true);
  });

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;