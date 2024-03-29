'use strict';

const _ = require('lodash');
const util = require('util');
const cliUi = require('./../service/cli-ui');
const inquirer = require('inquirer');
const stepBase = require('./../model/base-step');
const path = require('path');
const {reposService} = require('waffle-server-repo-service');
const logger = require('../config/logger');

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
const longPolling = require('./../service/request-polling');

const NEXT_STEP_PATH = 'choose-flow';
const HOLDER_KEY_DATASET_UPDATE = 'dataset-choose-update';
const HOLDER_KEY_DATASET_UPDATE_DATA = 'dataset-update-data';

step.prototype.preProcess = function (done) {

  let self = this;
  cliUi.state("get latest update hash commit from Waffle-Server");

  let data = {
    'github': this.holder.get(HOLDER_KEY_DATASET_UPDATE, false)
  };

  wsRequest.getLatestCommit(data, function (error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if (errorMsg) {
      self.setQuestionChoices([], []);
      cliUi.stop().logStart().error(errorMsg).logEnd();
      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    let responseData = wsResponse.getData();

    // get commit list

    self.holder.save(HOLDER_KEY_DATASET_UPDATE_DATA, responseData);

    let selectedDataSet = responseData.github;
    let commitFrom = gitFlow.getShortHash(responseData.commit);
    let choices = [];
    let nextStrategy = {};

    gitFlow.getCommitList(selectedDataSet, function (error, list) {

      if (!error) {

        list.reverse();

        let commitFromIndex = list.findIndex(function (item) {
          return item.hash == commitFrom;
        });

        choices = list.map(function (item, index) {
          nextStrategy[item.hash] = NEXT_STEP_PATH;
          let choiceData = {
            name: [item.hash, item.message].join(" "),
            value: item.hash
          };
          if (index < commitFromIndex) {
            choiceData['disabled'] = 'unavailable';
          }
          if (index == commitFromIndex) {
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
  cliUi.resetTime(false);
  cliUi.resetTime(false);
  let done = this.async();
  cliUi.state("processing Update Dataset");

  // back & exit
  if (!stepInstance.availableChoice(inputValue)) {
    cliUi.stop();
    return done(null, true);
  }

  let datasetData = stepInstance.holder.load(HOLDER_KEY_DATASET_UPDATE_DATA);
  let commitFrom = gitFlow.getShortHash(datasetData.commit);

  let data = {
    'github': datasetData.github,
    'commit': inputValue
  };

  cliUi.state("processing Update Dataset, validation");
  gitFlow.validateDataset(data, function (error) {

    if (error) {
      const formattedErrors = _.map(error, (item) => `TYPE: ${item.type}; FILE: ${item.path}; DATA: ${item.data};`);

      cliUi.stop().logStart().error("ValidationError").logEnd().logPrint(formattedErrors);

      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    const diffOptions = {
      'hashFrom': commitFrom,
      'hashTo': inputValue,
      'github': datasetData.github
    };


    if (error) {
      cliUi.stop().logStart().error(error).logEnd();

      // return done(errorMsg); :: inquirer bug, update after fix
      return done(null, true);
    }

    cliUi.state("processing Update Dataset, send request");
    wsRequest.updateDataset(diffOptions, function (updateError, wsResponse) {
      if (updateError) {
        logger.error({obj: {source:'import-cli', error: updateError, wsResponse}});
      }

      gitFlow.getRepoFolder(data.github, (repoError, {pathToRepo}) => {
        if (repoError) {
          logger.warn(repoError);
        }

        const prettifyResult = (stdout) => parseInt(stdout);

        reposService.getLinesAmount({pathToRepo, silent: true, prettifyResult}, (linesAmountError, numberOfRows) => {
          if (linesAmountError) {
            logger.warn(linesAmountError);
          }

          const errorMsg = updateError ? updateError.toString() : wsResponse.getError();

          if (errorMsg) {
            cliUi.stop().logStart().error(errorMsg).logEnd();
            return done(null, true);
          }

          let dataState = {
            'datasetName': gitFlow.getRepoName(datasetData.github)
          };

          longPolling.setTimeStart(numberOfRows);
          longPolling.checkDataSet(dataState, function (state) {

            // state.success
            if (!state.success) {
              cliUi.stop().logStart().error(state.message).logEnd();
            } else {
              cliUi.stop().logPrint([ state.message ]);
            }
            return done(null, true);
          });
        });
      });
    });
  });

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;