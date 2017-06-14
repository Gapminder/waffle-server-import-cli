'use strict';

const util = require('util');
const cliUi = require('./../service/cli-ui');
const inquirer = require('inquirer');
const stepBase = require('./../model/base-step');
const repoService = require('waffle-server-repo-service').default;

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

let question = {
  'name': 'reconnect-import-update',
  'type': 'list',
  'message': 'List of DataSets in progress',
  'choices': []
};

// Own Process Implementation

const wsRequest = require('./../service/request-ws');
const gitFlow = require('./../service/git-flow');
const longPolling = require('./../service/request-polling');

const NEXT_STEP_PATH = 'choose-flow';

step.prototype.preProcess  = function (done) {

  const self = this;
  const choices = [];
  const nextStrategy = {};
  const data = {};

  wsRequest.getDatasetsInProgress(data, function(error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      // error
      self.setQuestionChoices(choices, nextStrategy);
      cliUi.stop().error(errorMsg);
      return done(null, false);
    }

    const responseData = wsResponse.getData([]);

    if(!responseData.length) {
      cliUi.stop().warning("There are no available Datasets in Progress");
    }

    responseData.forEach(function(item){
      choices.push({
        name: item.name,
        value: item.githubUrl
      });
      nextStrategy[item.githubUrl] = NEXT_STEP_PATH;
    });

    self.setQuestionChoices(choices, nextStrategy);
    done();
  });

};

step.prototype.process = function (github) {
  cliUi.resetTime(false);

  const done = this.async();
  cliUi.state("processing, connect to dataset in progress");

  // back & exit
  if (!stepInstance.availableChoice(github)) {
    cliUi.stop();
    return done(null, true);
  }

  gitFlow.getRepoFolder(github, (repoError, pathToRepo) => {
    if (repoError && envConst.IS_NOT_PRODUCTION_ENV) {
      cliUi.warning(repoError);
    }

    const prettifyResult = (stdout) => parseInt(stdout);

    repoService.getAmountLines({pathToRepo, silent: true, prettifyResult}, (amountLinesError, numberOfRows) => {
      if (amountLinesError && envConst.IS_NOT_PRODUCTION_ENV) {
        cliUi.warning(amountLinesError);
      }

      let dataState = {
        'datasetName': gitFlow.getRepoName(github)
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

};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;