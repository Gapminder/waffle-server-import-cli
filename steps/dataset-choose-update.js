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

const question = {
  'name': 'dataset-choose-update',
  'type': 'list',
  'message': `List of DataSet Repositories (github.com, ${cliUi.CONST_FONT_BLUE}was loaded from Waffle Server${cliUi.CONST_FONT_WHITE})`,
  'choices': []
};

// Own Process Implementation

const NEXT_STEP_PATH = 'dataset-choose-update-hash';
const HOLDER_KEY_DATASET_LIST = 'dataset-list';

const wsRequest = require('./../service/request-ws');
const formatter = require('./../service/formatter');

step.prototype.preProcess  = function (done) {

  const self = this;

  wsRequest.getDataSetList({}, function(error, wsResponse) {

    const errorMsg = error ? error.toString() : wsResponse.getError();

    if (errorMsg) {
      cliUi.stop().logStart().error(errorMsg).logEnd();
      self.setQuestionChoices([], []);
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    const responseData = wsResponse.getData([]);
    stepInstance.holder.save(HOLDER_KEY_DATASET_LIST, responseData);

    const nextStrategy = {};
    let selectedDefault = false;

    const choices = responseData.map((item) => {

      nextStrategy[item.path] = NEXT_STEP_PATH;

      // detect default dataset
      if(item.isDefault) {

        selectedDefault = {
          name: item.name,
          value: item.path
        };

        item.versions.forEach(function(version){
          if(version.isDefault) {
            selectedDefault.name += ` / ${version.commit} / ${formatter.date(version.createdAt)} (default)`;
          }
        });
      }

      return {
        name: item.name,
        value: item.path
      };
    });

    // setup selected Default DataSet
    if(!!selectedDefault) {
      choices.unshift(selectedDefault);
    }

    self.setQuestionChoices(choices, nextStrategy);
    cliUi.stop();
    return done(null, true);
  });
};

step.prototype.process = function (inputValue) {

  const done = this.async();
  cliUi.state("processing selected repo for update");

  cliUi.stop();
  return done(null, true);

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;