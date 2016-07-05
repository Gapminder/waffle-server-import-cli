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
  'name': 'dataset-choose-default',
  'type': 'list',
  'message': 'Choose Default DataSet',
  'choices': []
};

// Own Process Implementation

const wsRequest = require('./../service/request-ws');
const formatter = require('./../service/formatter');
//const _ = require('lodash');

step.prototype.preProcess  = function (done) {

  let self = this;

  wsRequest.getDataSetList({}, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      cliUi.stop().logStart().error(errorMsg).logEnd();
      self.setQuestionChoices([], []);
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    let responseData = wsResponse.getData([]);
    stepInstance.holder.setResult('dataset-list', responseData);

    let nextStrategy = {};
    let selectedDefault = false;

    // _.find(responseData, dataset => _.find(dataset.versions, version => version.isDefault));

    let choices = responseData.map(function(item){

      nextStrategy[item.name] = 'dataset-choose-default-version';

      // detect default dataset
      if(item.isDefault) {

        selectedDefault = {
          name: item.name,
          value: item.name,
          disabled: 'default'
        };

        item.versions.forEach(function(version){
          if(version.isDefault) {
            selectedDefault.name += " / " + version.commit + " / " + formatter.date(version.createdAt) + "";
          }
        });
      }

      return {
        name: item.name,
        value: item.name
      };
    });

    // setup selected Default DataSet
    if(!!selectedDefault) {
      choices.unshift(selectedDefault);
    }

    self.setQuestionChoices(choices, nextStrategy);
    cliUi.stop();
    done(null, true);
  });
};


step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing Default Dataset");

  cliUi.stop();
  return done(null, true);
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;