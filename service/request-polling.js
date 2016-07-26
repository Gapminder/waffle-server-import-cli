'use strict';

const crypto = require('crypto');
const wsRequest = require('./request-ws');
const cliUi = require('./../service/cli-ui');

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
  if(this.response.length == this.responseLimit) {
    this.response.shift();
  }
  this.responseLastState = response.modifiedObjects;
  this.response.push(response);
};

longPolling.prototype._generateHash = function (obj) {
  return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');
};

longPolling.prototype._isSuccessful = function () {

  cliUi.state("check state, is success", true);

  let responses = this.response.slice();
  const lastResponse = responses.pop();
  const status = lastResponse.transaction.status;

  const importCompleted = 'Completed' == status && !lastResponse.transaction.lastError;
  const importInProgress = 'In progress' == status;

  if(importCompleted) {
    // completed and has no errors
    cliUi.state("check state, is success, completed", true);
    return true;
  }

  if (importInProgress) {
    // failed, should have last error
    cliUi.state("check state, is success, in progress", true);
    return false;
  }

  // failed, something went wrong
  cliUi.state("check state, is success, failed", true);
  return false;
};

longPolling.prototype._hasNoErrors = function () {

  let self = this;
  const responseLength = self.response.length;

  // check that response has no errors
  for(let i = 0; i < responseLength; i += 1) {
    if (!!this.response[i].transaction.lastError) {
      self.responseLastError = this.response[i].transaction.lastError;
      return false;
    }
  }

  return true;
};

longPolling.prototype._isResponseChanged = function () {

  let self = this;

  let responses = self.response.slice();
  const firstResponse = responses.shift();
  const firstResponseHash = self._generateHash(firstResponse.modifiedObjects);

  let responseWasNotChanged = responses.every(function(item){
    const currentResponseHash = self._generateHash(item.modifiedObjects);
    return currentResponseHash == firstResponseHash;
  });

  return !responseWasNotChanged;
};

longPolling.prototype._isMinimalRequestAmountReached = function () {

  if(this.responseCounter >= this.responseLimit) {
    return true;
  }

  return false;
};

longPolling.prototype._getLatestRequestReport = function () {

  if(!this.responseLastState) {
    return 'no data';
  }

  let mEntities = 'Entities: ' + this.responseLastState.entities;
  let mConcepts = 'Concepts: ' + this.responseLastState.concepts;
  let mDatapoints = 'DataPoints: ' + this.responseLastState.datapoints;

  return mConcepts+"; "+mEntities+"; "+mDatapoints;
};

longPolling.prototype._shouldContinue = function () {

  let self = this;

  if(!self._hasNoErrors()) {
    cliUi.state("check state, should not continue, has errors", true);
    return false;
  }

  if(!self._isMinimalRequestAmountReached()) {
    cliUi.state("check state, should continue, minimal request amount not reached", true);
    return true;
  }

  if(!self._isResponseChanged()) {
    cliUi.state("check state, should not continue, response not changed", true);
    return false;
  }

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

  wsRequest.getDatasetState(data, function(error, wsResponse) {

    const errorMsg = error ? error.toString() : wsResponse.getError();

    if(errorMsg) {
      return callback(self._completeRequest(false, errorMsg));
    }

    const responseData = wsResponse.getData([]);
    self._addResponse(responseData);

    if(!self._shouldContinue()) {

      // stop, because operation completed
      if(self._isSuccessful()) {
        // correct state and has no errors
        return callback(self._completeRequest(true, 'Dataset was imported successfully'));
      } else {
        // last error message
        return callback(self._completeRequest(false, self.responseLastError));
      }
    } else {

      // setup message lines for report
      let reportMessage = self._getLatestRequestReport();
      cliUi.state("check state, should continue ("+reportMessage+")", true);

      // new request
      setTimeout(function(){
        self.checkDataSet(data, callback);
      }, self.requestInterval);
    }

  });
};

module.exports = new longPolling();
