'use strict';

const async = require('async');
const crypto = require('crypto');
const wsRequest = require('./request-ws');
const cliUi = require('./../service/cli-ui');
const moment = require('moment');
const _ = require('lodash');

const ERROR_DATASET_WAS_NOT_FOUND = `Dataset was not found for the given name`;
const ERROR_DATASET_REMOVAL_IS_CORRUPTED = `Dataset removal is corrupted. Try to start removal again.`;
const OPERATION_IS_COMPLETED = 'Operation is completed successfully';
const OPERATION_IS_IN_PROGRESS = 'Operation is in progress';
const TRANSACTION_FAILED = 'Transaction failed. Please rollback transaction.';

let longPolling = function () {
  this.responseLimit = 3;
  this.requestInterval = 7000;
  this.reset();
};

longPolling.prototype.reset = function () {
  this.response = [];
  this.responseCounter = 0;

  this.responseLastError = '';
  this.responseLastState = false;
  this.processStatus = false;
};

longPolling.prototype._addResponse = function (response) {
  if (this.response.length == this.responseLimit) {
    this.response.shift();
  }
  this.responseLastState = response.modifiedObjects;
  this.response.push(response);
};

longPolling.prototype._generateHash = function (obj) {
  try {
    const str = JSON.stringify(obj);
    return crypto.createHash('md5').update(str).digest('hex');
  } catch (error) {
    cliUi.stop().error(error);
  }
};

longPolling.prototype._isSuccessful = function () {

  let responses = this.response.slice();
  const lastResponse = responses.pop();
  const status = lastResponse.transaction.status;

  const importCompleted = 'Completed' == status && !lastResponse.transaction.lastError;
  const importInProgress = 'In progress' == status;

  if (importCompleted) {
    // completed and has no errors
    cliUi.state('check state, completed', false);
    return true;
  }

  if (importInProgress) {
    // failed, should have last error
    cliUi.state('check state, in progress');
    return false;
  }

  // failed, something went wrong
  cliUi.state('check state, failed', false);
  return false;
};

longPolling.prototype._hasNoErrors = function () {

  const self = this;
  // check that responses has no errors
  const lastError = _.findLast(self.response, (response) => _.get(response, 'transaction.lastError', false));

  if (lastError) {
    self.responseLastError = lastError;
    return false;
  }

  return true;
};

// deprecated
longPolling.prototype._isResponseChanged = function () {

  let self = this;

  if (self.response.length < self.responseLimit) {
    return true;
  }

  let responses = self.response.slice();
  const firstResponse = responses.shift();
  const firstResponseHash = self._generateHash(firstResponse.modifiedObjects);

  let responseWasNotChanged = responses.every(function (item) {
    const currentResponseHash = self._generateHash(item.modifiedObjects);
    return currentResponseHash == firstResponseHash;
  });

  return !responseWasNotChanged;
};

longPolling.prototype._isMinimalRequestAmountReached = function () {
  return true;

  // deprecated
  if (this.responseCounter >= this.responseLimit) {
    return true;
  }

  return false;
};

longPolling.prototype._getLatestRequestReport = function () {

  if (_.isEmpty(this.responseLastState)) {
    return 'no data';
  }

  let logMessage = [];

  const timeStart = this.timeStart.getTime();
  const timeNow = new Date().getTime();
  const timeDiff = (timeNow - timeStart) / 1000;

  const dataEntities = _.get(this.responseLastState, 'entities', 0);
  const dataConcepts = _.get(this.responseLastState, 'concepts', 0);
  const dataDatapoints = _.get(this.responseLastState, 'datapoints', 0);
  const dataTranslations = _.get(this.responseLastState, 'translations', 0);

  const totalItemsDone = dataEntities + dataConcepts + dataDatapoints + dataTranslations;
  const TotalTime = totalItemsDone ? Math.round(this.numberOfRows * (timeDiff / totalItemsDone)) : 0;

  logMessage.push(dataEntities ? 'Entities: ' + dataEntities + ';' : '');
  logMessage.push(dataConcepts ? 'Concepts: ' + dataConcepts + ';' : '');
  logMessage.push(dataDatapoints ? 'DataPoints: ' + dataDatapoints + ';' : '');
  logMessage.push(dataTranslations ? 'Translations: ' + dataTranslations + ';' : '');
  logMessage.push(TotalTime ? `| Time estimated: ${moment.duration(TotalTime, 'seconds').humanize()}` : '');

  return logMessage.filter(function (value) {
    return !!value;
  }).join(' ');
};

longPolling.prototype._getRemovalReportFromLatestRequest = function () {

  if (!this.responseLastState) {
    return '';
  }

  const removedConcepts = _.get(this.responseLastState, 'concepts', 0);
  const removedEntities = _.get(this.responseLastState, 'entities', 0);
  const removedDatapoints = _.get(this.responseLastState, 'datapoints', 0);

  const result = [
    toStringRemovedDocs(removedConcepts, 'Concepts'),
    toStringRemovedDocs(removedEntities, 'Entities'),
    toStringRemovedDocs(removedDatapoints, 'DataPoints')
  ];

  return result.join(' ');
};

function toStringRemovedDocs(numDocuments, type) {
  return numDocuments ? `${type}: ${numDocuments};` : '';
}

longPolling.prototype.setTimeStart = function (numberOfRows) {
  this.timeStart = new Date();
  this.numberOfRows = numberOfRows;
};

longPolling.prototype._shouldContinue = function () {

  let self = this;

  if (!self._hasNoErrors()) {
    cliUi.state('check state, should not continue, has errors', false);
    return false;
  }

  if (!self._isMinimalRequestAmountReached()) {
    cliUi.state('check state, should continue, minimal request amount not reached');
    return true;
  }

  return true;
};

longPolling.prototype._completeRequest = function (state, message, reportFunction = '_getLatestRequestReport') {
  const _message = `${message}${state ? '\n' + this[reportFunction]() : ''}`;
  this.reset();

  return {
    'success': state,
    'message': _message
  };
};

function getDatasetState(self, data, callback) {

  return setTimeout(() => wsRequest.getDatasetState(data, function (error, wsResponse) {
    self.responseCounter++;

    const errorMsg = error ? error.toString() : wsResponse.getError();

    if (errorMsg) {
      return callback(errorMsg);
    }

    const responseData = wsResponse.getData([]);
    self._addResponse(responseData);

    const isSuccessful = self._isSuccessful();

    if (!self._shouldContinue() || isSuccessful) {
      // stop, because operation completed
      if (isSuccessful) {
        // correct state and has no errors
        return callback(null, OPERATION_IS_COMPLETED);
      } else {
        // last error message
        return callback(null, self.responseLastError);
      }
    }

    return callback();
  }), self.requestInterval);
}

longPolling.prototype._checkDatasetStateResult = function () {
  const self = this;

  if (!self._shouldContinue() || self._isSuccessful()) {
    // stop, because operation completed
    return false;
  }
  // setup message lines for report
  let reportMessage = self._getLatestRequestReport();
  if (reportMessage) {
    cliUi.state('check state, in progress: ' + reportMessage);
  }

  // new request
  return true;
};

longPolling.prototype.checkDataSet = function (data, callback) {

  let self = this;
  self.responseCounter = 0;

  return async.doWhilst(
    async.apply(getDatasetState, self, data),
    self._checkDatasetStateResult.bind(self),
    (error, result) => {
      const transactionError = _.get(result, 'transaction.lastError', false);
      
      if (error) {
        return callback(self._completeRequest(false, error));
      }

      if (!result) {
        return callback(self._completeRequest(false, 'no result'));
      }
      
      if(transactionError) {
        return callback(self._completeRequest(false, `${TRANSACTION_FAILED}\n${transactionError}`));
      }
      
      return callback(self._completeRequest(true, OPERATION_IS_COMPLETED));
    }
  );
};

longPolling.prototype._getDatasetRemovalStatus = function (error, wsResponse) {

  const errorMsg = error ? error.toString() : wsResponse.getError();
  const isResponseSuccessful = _.isEmpty(wsResponse) ? false : wsResponse.isSuccess();

  if (!this._isResponseChanged()) {
    cliUi.state('check state, failed', false);
    return {isRemovalFinished: true, isRemovalSuccessful: false, message: ERROR_DATASET_REMOVAL_IS_CORRUPTED};
  }

  if (isResponseSuccessful) {
    cliUi.state('check state, in progress');
    return {isRemovalFinished: false, isRemovalSuccessful: false, message: OPERATION_IS_IN_PROGRESS};
  }

  if (!isResponseSuccessful && _.includes(errorMsg, ERROR_DATASET_WAS_NOT_FOUND)) {
    cliUi.state('check state, completed', false);
    return {isRemovalFinished: true, isRemovalSuccessful: true, message: OPERATION_IS_COMPLETED};
  }

  cliUi.state('check state, failed', false);
  return {isRemovalFinished: true, isRemovalSuccessful: false, message: errorMsg};
};

longPolling.prototype._checkDatasetRemovableStatus = function () {
  const self = this;

  // setup message lines for report
  let reportMessage = self._getRemovalReportFromLatestRequest();

  if (reportMessage) {
    cliUi.state('removal progress: ' + reportMessage);
  }

  // new request
  return _.get(self.processStatus, 'isRemovalFinished', false);
};

function getDatasetRemovableStatus(self, data, callback) {
  return setTimeout(() => wsRequest.removableStatus(data, function (error, wsResponse) {
    self.responseCounter++;

    const responseData = _.isEmpty(wsResponse) ? {} : wsResponse.getData([]);
    self._addResponse({modifiedObjects: responseData});
    self.processStatus =  self._getDatasetRemovalStatus(error, wsResponse);

    return callback(null, self.processStatus);
  }), self.requestInterval);
}

longPolling.prototype.checkDataSetRemovingStatus = function (data, callback) {

  let self = this;
  self.responseCounter = 0;

  return async.doUntil(
    async.apply(getDatasetRemovableStatus, self, data),
    self._checkDatasetRemovableStatus.bind(self),
    (error, result) => {
      const {isRemovalSuccessful, message} = result;
      return callback(self._completeRequest(isRemovalSuccessful, message, '_getRemovalReportFromLatestRequest'));
    }
  );
};

// todo: change to factory
module.exports = new longPolling();
