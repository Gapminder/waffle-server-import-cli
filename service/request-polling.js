'use strict';

const crypto = require('crypto');
const wsRequest = require('./request-ws');
const cliUi = require('./../service/cli-ui');
const moment = require('moment');
const _ = require('lodash');
require('moment-duration-format');

const ERROR_DATASET_WAS_NOT_FOUND = `Dataset was not found for the given name`;
const ERROR_DATASET_REMOVAL_IS_CORRUPTED = `Dataset removal is corrupted. Try to start removal again.`;
const OPERATION_IS_COMPLETED = 'Operation is completed successfully';
const OPERATION_IS_IN_PROGRESS = 'Operation is in progress';

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
};

longPolling.prototype._addResponse = function (response) {
  if (this.response.length == this.responseLimit) {
    this.response.shift();
  }
  this.responseLastState = response.modifiedObjects;
  this.response.push(response);
};

longPolling.prototype._generateHash = function (obj) {
  return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
};

longPolling.prototype._isSuccessful = function () {

  let responses = this.response.slice();
  const lastResponse = responses.pop();
  const status = lastResponse.transaction.status;

  const importCompleted = 'Completed' == status && !lastResponse.transaction.lastError;
  const importInProgress = 'In progress' == status;

  if (importCompleted) {
    // completed and has no errors
    cliUi.state("check state, completed", true);
    return true;
  }

  if (importInProgress) {
    // failed, should have last error
    cliUi.state("check state, in progress", true);
    return false;
  }

  // failed, something went wrong
  cliUi.state("check state, failed", true);
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

  if (!this.responseLastState) {
    return 'no data';
  }

  let logMessage = [];

  const timeStart = this.timeStart.getTime();
  const timeNow = new Date().getTime();
  const timeDiff = (timeNow - timeStart) / 1000;

  const dataEntities = _.get(this.responseLastState, 'entities', 0);
  const dataConcepts = _.get(this.responseLastState, 'concepts', 0) ;
  const dataDatapoints = _.get(this.responseLastState, 'datapoints', 0);
  const dataTranslations = _.get(this.responseLastState, 'translations', 0);

  const TIME_LOG_FORMAT = "y[y] M[m] d[d] hh:mm:ss[s]";
  const totalItemsDone = dataEntities + dataConcepts + dataDatapoints + dataTranslations;
  const TotalTime = totalItemsDone ? Math.round(this.numberOfRows * (timeDiff / totalItemsDone)) : 0;

  logMessage.push(dataEntities ? 'Entities: ' + dataEntities + ';' : '');
  logMessage.push(dataConcepts ? 'Concepts: ' + dataConcepts + ';' : '');
  logMessage.push(dataDatapoints ? 'DataPoints: ' + dataDatapoints + ';' : '');
  logMessage.push(dataTranslations ? 'Translations: ' + dataTranslations + ';' : '');
  logMessage.push(TotalTime ? 'Total approximate time: ' + moment.duration(TotalTime, 'seconds').format(TIME_LOG_FORMAT, {trim: "left"}) + ';' : '');

  return logMessage.filter(function (value) {
    return !!value;
  }).join(' ');
};

longPolling.prototype._getRemovalReportFromLatestRequest = function() {

  if (!this.responseLastState) {
    return '';
  }

  let removedConcepts = _.get(this.responseLastState, 'concepts', 0);
  let removedEntities = _.get(this.responseLastState, 'entities', 0);
  let removedDatapoints = _.get(this.responseLastState, 'datapoints', 0);

  return `${toStringRemovedDocs(removedConcepts, 'Concepts')}${toStringRemovedDocs(removedEntities, 'Entities')}${toStringRemovedDocs(removedDatapoints, 'DataPoints')}`;
};

function toStringRemovedDocs(numDocuments, type) {
  return numDocuments ? `${type}: ${numDocuments}; ` : '';
}

longPolling.prototype.setTimeStart = function (numberOfRows) {
  this.timeStart = new Date();
  this.numberOfRows = numberOfRows;
};

longPolling.prototype._shouldContinue = function () {

  let self = this;

  if (!self._hasNoErrors()) {
    cliUi.state("check state, should not continue, has errors", true);
    return false;
  }

  if (!self._isMinimalRequestAmountReached()) {
    cliUi.state("check state, should continue, minimal request amount not reached", true);
    return true;
  }

  return true;
};

longPolling.prototype._completeRequest = function (state, message, reportFunction = '_getLatestRequestReport') {

  message = state ? message + "\n" + this[reportFunction]() : message;
  this.reset();

  return {
    'success': state,
    'message': message
  };
};

longPolling.prototype.checkDataSet = function (data, callback) {

  let self = this;
  self.responseCounter++;

  wsRequest.getDatasetState(data, function (error, wsResponse) {

    const errorMsg = error ? error.toString() : wsResponse.getError();

    if (errorMsg) {
      return callback(self._completeRequest(false, errorMsg));
    }

    const responseData = wsResponse.getData([]);
    self._addResponse(responseData);

    const isSuccessful = self._isSuccessful();

    if (!self._shouldContinue() || isSuccessful) {

      // stop, because operation completed
      if (isSuccessful) {
        // correct state and has no errors
        return callback(self._completeRequest(true, OPERATION_IS_COMPLETED));
      } else {
        // last error message
        return callback(self._completeRequest(false, self.responseLastError));
      }
    } else {

      // setup message lines for report
      let reportMessage = self._getLatestRequestReport();
      if (reportMessage) {
        cliUi.state("in progress: " + reportMessage, true);
      }

      // new request
      setTimeout(function () {
        self.checkDataSet(data, callback);
      }, self.requestInterval);
    }

  });
};

longPolling.prototype._getDatasetRemovalStatus = function (error, wsResponse) {

  const errorMsg = error ? error.toString() : wsResponse.getError();
  const isResponseSuccessful = wsResponse.isSuccess();

  if (!this._isResponseChanged()) {
    cliUi.state("check state, failed", true);
    return {isRemovalFinished: true, isRemovalSuccessful: false, message: ERROR_DATASET_REMOVAL_IS_CORRUPTED};
  }

  if (isResponseSuccessful) {
    cliUi.state("check state, in progress", true);
    return {isRemovalFinished: false, isRemovalSuccessful: false, message: OPERATION_IS_IN_PROGRESS};
  }

  if (!isResponseSuccessful && _.includes(errorMsg, ERROR_DATASET_WAS_NOT_FOUND)) {
    cliUi.state("check state, completed", true);
    return {isRemovalFinished: true, isRemovalSuccessful: true, message: OPERATION_IS_COMPLETED};
  }

  cliUi.state("check state, failed", true);
  return {isRemovalFinished: true, isRemovalSuccessful: false, message: errorMsg};
};

longPolling.prototype.checkDataSetRemovingStatus = function (data, callback) {

  let self = this;
  self.responseCounter++;

  wsRequest.removableStatus(data, function (error, wsResponse) {
    const responseData = wsResponse.getData([]);
    self._addResponse({modifiedObjects: responseData});

    const {isRemovalFinished, isRemovalSuccessful, message} = self._getDatasetRemovalStatus(error, wsResponse);

    if (isRemovalFinished) {
      return callback(self._completeRequest(isRemovalSuccessful, message, '_getRemovalReportFromLatestRequest'));
    } else {

      // setup message lines for report
      let reportMessage = self._getRemovalReportFromLatestRequest();

      if (reportMessage) {
        cliUi.state("removal progress: " + reportMessage, true);
      }

      // new request
      setTimeout(() => {
        self.checkDataSetRemovingStatus(data, callback);
      }, self.requestInterval);
    }
  })
};

// todo: change to factory
module.exports = new longPolling();
