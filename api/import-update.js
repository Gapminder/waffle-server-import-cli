'use strict';

const _ = require('lodash');
const async = require('async');
require('./../service/env-init');

const cliUi = require('./../service/cli-ui');
const holder = require('./../model/value-holder');
const gitFlow = require('./../service/git-flow');
const wsRequest = require('./../service/request-ws');
const longPolling = require('./../service/request-polling');
const logger = require('../config/logger');
const {reposService} = require('waffle-server-repo-service');
const path = require('path');


/**
 *
 * Automatically Import and Update Repo
 * @param {Object} options
 * @param {Function} complete
 *
 *
 * Object options
 * @attribute {String} repo, github url to repository
 * @attribute {String} from, (optional) hash of the commit for Import
 * @attribute {String} to, (optional) hash of the commit where to stop Update
 * @attribute {String} login, authentication param to WS
 * @attribute {String} pass, authentication param to WS
 * @attribute {String} ws_host, WS-Endpoint host
 * @attribute {String} ws_port, WS-Endpoint port
 *
 */

function CliToolApiAutoImport(options, complete) {

  options = options || {};

  // validate

  if (!options.repo || !options.login || !options.pass) {
    let message = "Some parameter was missed (REPO, LOGIN, PASS, WS_HOST, WS_PORT)";
    cliUi.error(message);
    return complete(message);
  }

  console.time('time::done');

  /* setup flow */

  const wsHost = options.ws_host || 'http://localhost';
  const wsPort = options.ws_port || '3000';

  holder.set('ws-list-choose', `${wsHost}:${wsPort}`);
  holder.save('cli-options', options);

  async.waterfall([
    authentication,
    repoInit,
    repoImport,
    repoUpdate
  ], function (error, success) {

    if (error) {
      cliUi.error(error);
      return complete(error);
    }

    console.timeEnd('time::done');
    return complete();
  });
}

module.exports = CliToolApiAutoImport;


/* additional :: private usage */

function authentication(callback) {

  const cliOptions = holder.load('cli-options');

  let data = {
    email: cliOptions.login,
    password: cliOptions.pass
  };

  wsRequest.authenticate(data, function (error, wsResponse) {

    let errorMsg = error ? error.toString() : wsResponse.getError();

    if (errorMsg) {
      return callback(errorMsg);
    }

    let responseData = wsResponse.getData();
    holder.save('auth-token', responseData);
    cliUi.success("Authenticate: OK");

    return callback();
  });
}

function repoInit(callback) {

  const cliOptions = holder.load('cli-options');

  gitFlow.getCommitList(cliOptions.repo, function (error, list) {

    cliUi.stop();

    if (error) {
      return callback(error);
    }

    list.reverse();
    holder.save('repo-commit-list', list);
    cliUi.success("Repo Init: OK");

    return callback();
  });
}

function repoImport(callback) {

  let commitList = holder.load('repo-commit-list', []);
  const cliOptions = holder.load('cli-options');
  const firstCommit = commitList[0];
  const importCommitHash = cliOptions.from || firstCommit.hash;

  let data = {
    'github': cliOptions.repo,
    'commit': importCommitHash
  };

  cliUi.state("processing Import Dataset, validation");
  gitFlow.validateDataset(data, function (error) {

    if (error) {
      cliUi.stop().error("Import Dataset: Validation Error");
      return callback(error);
    }

    cliUi.state("processing Import Dataset, send request");
    wsRequest.importDataset(data, function (importError, wsResponse) {
      if (importError) {
        logger.warn(importError);
      }

      gitFlow.getRepoFolder(data.github, (repoError, {pathToRepo}) => {
        if (repoError) {
          logger.warn(repoError);
        }

        const prettifyResult = (stdout) => parseInt(stdout);

        cliUi.state(`Try to get lines amount`);

        reposService.getLinesAmount({pathToRepo, silent: true, prettifyResult}, (linesAmountError, numberOfRows) => {
          if (linesAmountError) {
            logger.warn(linesAmountError);
          }

          cliUi.state(`Lines amount: ${numberOfRows}`);

          let errorMsg = error ? error.toString() : wsResponse.getError();

          if (errorMsg) {
            cliUi.stop();
            return callback(errorMsg);
          }

          let dataState = {
            'datasetName': gitFlow.getRepoName(data.github)
          };

          longPolling.setTimeStart(numberOfRows);
          longPolling.checkDataSet(dataState, function (state) {

            // state.success
            if (!state.success) {
              cliUi.stop().logStart().error(state.message).logEnd();
              return callback(state.message);
            }

            cliUi.stop().success("Repo Import: OK (based on #" + importCommitHash + ")");
            return callback();
          });
        })
      });
    });
  });
}

function repoUpdate(callback) {

  let commitList = holder.load('repo-commit-list', []);
  const cliOptions = holder.load('cli-options');
  const firstCommit = commitList[0];
  const importCommitHash = cliOptions.from || firstCommit.hash;

  // pre-process commit list

  let importCommitIndex = -1;
  let latestCommitIndex = commitList.length - 1;

  let filteredList = commitList.filter(function (item, itemIndex) {

    const result = (importCommitIndex === -1 || itemIndex > latestCommitIndex) ? false : true;

    importCommitIndex = (item.hash === importCommitHash) ? itemIndex : importCommitIndex;
    latestCommitIndex = (item.hash === cliOptions.to) ? itemIndex : latestCommitIndex;

    return result;
  });

  holder.save('repo-update-commit-prev', importCommitHash);

  async.mapSeries(filteredList, incrementalUpdate, function () {
    callback();
  });
}

function incrementalUpdate(item, callback) {

  const prevItemHash = holder.load('repo-update-commit-prev');
  const cliOptions = holder.load('cli-options');

  /* process */

  const commitFrom = prevItemHash;
  const commitTo = item.hash;

  let data = {
    'github': cliOptions.repo,
    'commit': commitTo
  };

  cliUi.state("processing Update Dataset, validation");
  gitFlow.validateDataset(data, function (error) {

    if (error) {
      cliUi.stop().error("Update Dataset: Validation Error");
      logger.error({obj: {source: 'import-cli', error}});
      return callback(error);
    }

    const diffOptions = {
      'hashFrom': commitFrom,
      'hashTo': commitTo,
      'github': cliOptions.repo
    };

    cliUi.state("processing Update Dataset, send request");

    wsRequest.updateDataset(diffOptions, function (updateError, wsResponse) {
      if (updateError) {
        logger.error({obj: {source: 'import-cli', error: updateError}});
      }

      const errorMsg = updateError ? updateError.toString() : wsResponse.getError();

      if (errorMsg) {
        cliUi.stop();
        return callback(errorMsg);
      }

      let dataState = {
        'datasetName': gitFlow.getRepoName(cliOptions.repo)
      };

      longPolling.setTimeStart(0);
      longPolling.checkDataSet(dataState, function (state) {

        // state.success
        if (!state.success) {
          cliUi.stop().logStart().error(state.message).logEnd();
        } else {
          logger.info({obj: {state}});
        }

        cliUi.stop().success("Repo Updated: OK (from: #" + commitFrom + "; to: #" + commitTo + ")");
        holder.save('repo-update-commit-prev', item.hash);

        return callback();
      });
    });
  });
}