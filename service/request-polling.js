'use strict';

const crypto = require('crypto');
const wsRequest = require('./request-ws');
const cliUi = require('./../service/cli-ui');
const moment = require('moment');
const _ = require('lodash');
require('moment-duration-format');

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

  let self = this;
  const responseLength = self.response.length;

  // check that response has no errors
  for (let i = 0; i < responseLength; i += 1) {
    if (!!this.response[i].transaction.lastError) {
      self.responseLastError = this.response[i].transaction.lastError;
      return false;
    }
  }

  return true;
};

// deprecated
longPolling.prototype._isResponseChanged = function () {

  let self = this;

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

  const dataEntities = this.responseLastState.entities || 0;
  const dataConcepts = this.responseLastState.concepts || 0;
  const dataDatapoints = this.responseLastState.datapoints || 0;
  const dataTranslations = this.responseLastState.translations || 0;

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

longPolling.prototype._getLatestRequestReportForRemove = function(wsResponse) {

  let logMessage = [];

  let removedConcepts = _.get(wsResponse.response, 'data.concepts', 0);
  let removedEntities = _.get(wsResponse.response, 'data.entities', 0);
  let removedDatapoints = _.get(wsResponse.response, 'data.datapoints', 0);

  logMessage.push(removedEntities ? 'Entities: ' + removedEntities + ';' : '');
  logMessage.push(removedConcepts ? 'Concepts: ' + removedConcepts + ';' : '');
  logMessage.push(removedDatapoints ? 'DataPoints: ' + removedDatapoints + ';' : '');

  return logMessage.filter(function (value) {
    return !!value;
  }).join(' ');
};

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

  /*
   // change logic that detect complete of operation
   if(!self._isResponseChanged()) {
   cliUi.state("check state, should not continue, response not changed", true);
   return false;
   }
   */

  return true;
};

longPolling.prototype._completeRequest = function (state, message) {

  message = state ? message + "\n" + this._getLatestRequestReport() : message;
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
        return callback(self._completeRequest(true, 'Operation completed successfully'));
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

longPolling.prototype._isSuccessfulForRemove = function (wsResponse) {

  let successfulResponse = _.get(wsResponse.response, 'success');

  if (successfulResponse === true) {
    cliUi.state("check state, in progress", true);
    return false;
  }

  if (successfulResponse === false) {
    cliUi.state("check state, completed", true);
    return true;
  }

  cliUi.state("check state, failed", true);
  return true;
};

longPolling.prototype.checkDataSetForRemove = function (data, callback) {

  let self = this;
  self.responseCounter++;

   wsRequest.removableStatus(data, function (error, wsResponse) {

    const isSuccessful = self._isSuccessfulForRemove(wsResponse);

    if (!self._shouldContinue() || isSuccessful) {

      // stop, because operation completed
      if (isSuccessful) {
        // correct state and has no errors
        return callback(self._completeRequest(true, 'Operation completed successfully'));
      } else {
        // last error message
        return callback(self._completeRequest(false, self.responseLastError));
      }
    } else {

      // setup message lines for report
      let reportMessage = self._getLatestRequestReportForRemove(wsResponse);

      if (reportMessage) {
        cliUi.state("removal progress: " + reportMessage, true);
      }

      // new request
      setTimeout(function () {
        self.checkDataSetForRemove(data, callback);
      }, self.requestInterval);
    }
  })
};

module.exports = new longPolling();
