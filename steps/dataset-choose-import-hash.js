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
  'name': 'dataset-choose-import-hash',
  'type': 'list',
  'message': 'List of Available Commits',
  'choices': []
};

// Own Process Implementation

const wsRequest = require('./../service/request-ws');
const gitFlow = require('./../service/git-flow');
const longPolling = require('./../service/request-polling');
const shell = require('shelljs');

const NEXT_STEP_PATH = 'choose-flow';
const HOLDER_KEY_DATASET_IMPORT = 'dataset-choose-import';
const HOLDER_KEY_DATASET_REPO_TYPE = 'dataset-choose-repo-type';

step.prototype.preProcess = function (done) {

  let self = this;
  let nextStrategy = {};
  let choices = [];
  let selectedDataSet = this.holder.get(HOLDER_KEY_DATASET_IMPORT, '');

  gitFlow.getCommitList(selectedDataSet, function (error, list) {

    if (!error) {

      list.reverse();

      choices = list.map(function (item) {
        nextStrategy[item.hash] = NEXT_STEP_PATH;
        return {
          name: [item.hash, item.message].join(" "),
          value: item.hash
        };
      });
      self.setQuestionChoices(choices, nextStrategy);

      cliUi.stop();
      return done(null, true);

    } else {
      // error
      self.setQuestionChoices(choices, nextStrategy);
      cliUi.stop().error("Get Commit List Failed");
      return done(null, false);
    }
  });
};


step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("processing Import Dataset, send request");

  // back & exit
  if (!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  let data = {
    'github': stepInstance.holder.get(HOLDER_KEY_DATASET_IMPORT, false),
    'repoType': stepInstance.holder.get(HOLDER_KEY_DATASET_REPO_TYPE, false),
    'commit': inputValue
  };

  cliUi.state("processing Import Dataset, validation");

  gitFlow.validateDataset(data, function (error) {

    if (error) {
      cliUi.stop().logPrint(error);
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    cliUi.state("processing Import Dataset, send request");

    wsRequest.importDataset(data, function (error, wsResponse) {

      let gitRepoPath = gitFlow.getRepoFolder(data.github);
      let commandLinesOfCode = `wc -l ${gitRepoPath}/*.csv | grep "total$"`;

      shell.exec(commandLinesOfCode, {silent: true}, function (err, stdout) {
        let numberOfRows = parseInt(stdout);

        let errorMsg = error ? error.toString() : wsResponse.getError();

        if (errorMsg) {
          cliUi.stop().logStart().error(errorMsg).logEnd();
          // return done(errorMsg); :: inquirer bug, update after fix
          return done(null, true);
        }

        let dataState = {
          'datasetName': gitFlow.getRepoName(data.github)
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
    });
  });
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;