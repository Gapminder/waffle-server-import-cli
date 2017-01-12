'use strict';

const request = require('superagent');
const JSONStream = require('JSONStream');
const wsResponse = require('./../model/ws-response');
const holder = require('./../model/value-holder');

const Address4 = require('ip-address').Address4;
const Address6 = require('ip-address').Address6;

// Predefined Routes

const ROUTE_WS_AUTH             = '/api/ddf/cli/authenticate';
const ROUTE_WS_IMPORT           = '/api/ddf/cli/import-dataset';
const ROUTE_WS_UPDATE           = '/api/ddf/cli/update-incremental';
const ROUTE_WS_ROLLBACK         = '/api/ddf/cli/transactions/latest/rollback';
const ROUTE_WS_REMOVE_DATASET   = '/api/ddf/cli/remove-dataset';
const ROUTE_WS_REMOVABLE_LIST   = '/api/ddf/cli/datasets/removable';
const ROUTE_WS_DATASET_LIST     = '/api/ddf/cli/datasets';
const ROUTE_WS_LATEST_COMMIT    = '/api/ddf/cli/commit-of-latest-dataset-version';
const ROUTE_WS_DATASET_STATE    = '/api/ddf/cli/transactions/latest/status';
const ROUTE_WS_PRESTORED_QUERY  = '/api/ddf/cli/prestored-queries';
const ROUTE_WS_DATASET_DEFAULT  = '/api/ddf/cli/datasets/default';
const ROUTE_WS_ACCESS_TOKEN     = '/api/ddf/cli/datasets/accessToken';

//const REQUEST_TIMEOUT = 2 * 60 * 60 * 1000;
// Linux kernel TCP :: max 120 seconds
const REQUEST_TIMEOUT = 110 * 1000;
const REQUEST_TOKEN_PARAM = 'waffle-server-token';
const REQUEST_TYPE_GET = 'get';
const REQUEST_TYPE_POST = 'post';

const HOLDER_KEY_TOKEN = 'auth-token';
const HOLDER_KEY_WS_SOURCE = 'ws-list-choose';

// Logger
/*
var fs = require('fs');
var util = require('util');
const envConst = require('./../model/env-const');
const LOG_FILE_PATH = envConst.PATH_FILE_DEBUG;
var log_file = fs.createWriteStream(LOG_FILE_PATH, {flags : 'w'});
*/

function wsRequest() {};

/*

  Request to WS :: Authenticate

  GET: /api/ddf/cli/authenticate

  @param email, String
  @param password, String

  RESPONSE, data:

    {
      token: "aaabbbcccddd"
    }

*/

wsRequest.prototype.authenticate = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_POST, ROUTE_WS_AUTH, data, callback);
};

/*

 Request to WS :: Generate Access Token

 GET: /api/ddf/cli/datasets/accessToken

 @param datasetName, String

 RESPONSE, data:

  {
    accessToken: "aaabbbcccddd"
  }

 */

wsRequest.prototype.getAccessToken = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_POST, ROUTE_WS_ACCESS_TOKEN, data, callback);
};

/*

  Request to WS :: Get List of Datasets

  GET: /api/ddf/cli/datasets

  RESPONSE, data: Array(Objects)

    [
      {name: 'validated1'},
      {name: 'validated2'}
    ]

*/

wsRequest.prototype.getDataSetList = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_GET, ROUTE_WS_DATASET_LIST, data, callback);
};

/*

  Request to WS :: Set Default Dataset

  POST: /api/ddf/cli/datasets/default

  @param datasetName, String
  @param commit, String

  RESPONSE, data: not provided

*/

wsRequest.prototype.setDefaultDataSet = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_POST, ROUTE_WS_DATASET_DEFAULT, data, callback);
};

/*

  Request to WS :: Get Prestored Queries

  GET: /api/ddf/cli/prestored-query

  RESPONSE, data: Array(Objects)

  [
    {
      "url": "http://localhost:3000/api/ddf/stats...lation,energy_use_total",
      "datasetName": "ddf--gapminder_world-stub-1",
      "version": 1466591220748,
      "createdAt": "2016-06-22T10:27:00.748Z"
    },
    ...
  ]

*/

wsRequest.prototype.getPrestoredQueries = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_GET, ROUTE_WS_PRESTORED_QUERY, data, callback);
};

/*

  Request to WS :: Get list of registered Datasets with states

  GET: /api/ddf/cli/dataset/status

  @param datasetName, String

  RESPONSE, data: Object

    {
      "datasetName": "ddf--gapminder_world-stub-1",
      "transaction": {
        "commit": "aafed7d",
        "status": "Completed",
        "createdAt": "2016-06-22T09:42:42.321Z"
      },
      "modifiedObjects": {
        "concepts": 27,
        "entities": 132,
        "datapoints": 1362
      }
    }

*/

wsRequest.prototype.getDatasetState = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_GET, ROUTE_WS_DATASET_STATE, data, callback);
};

/*

  Request to WS :: Rollback latest transaction

  POST: /api/ddf/cli/transactions/latest/rollback

  @param datasetName, String

  RESPONSE, data: not provided

*/

wsRequest.prototype.rollback = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_POST, ROUTE_WS_ROLLBACK, data, callback);
};

/*

  Request to WS :: Remove Dataset and all related data and transactions

  POST: /api/ddf/cli/remove-dataset

  @param datasetName, String

  RESPONSE, data: not provided

*/

wsRequest.prototype.removeDataset = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_POST, ROUTE_WS_REMOVE_DATASET, data, callback);
};

/*

  Request to WS :: Get List of Removable Datasets

  GET: /api/ddf/cli/datasets/removable

  RESPONSE, data: Collection

    [
      {
        "name": "VS-work/ddf--ws-testing",
        "githubUrl": "git@github.com:VS-work/ddf--ws-testing.git"
      },
      ...
    ]

*/

wsRequest.prototype.removableDatasetList = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_GET, ROUTE_WS_REMOVABLE_LIST, data, callback);
};

/*

  Request to WS :: Import Dataset

  GET: /api/ddf/cli/import-dataset

  @param github, String   [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]
  @param commit, String   [aafed7d4dcda8d736f317e0cd3eaff009275cbb6]

  RESPONSE, data: not provided

*/

wsRequest.prototype.importDataset = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_POST, ROUTE_WS_IMPORT, data, callback);
};

/*

  Request to WS :: Get Latest commit hash

  GET: /api/ddf/cli/commit-of-latest-dataset-version

  @param github, String   [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]

  RESPONSE, data: Object

     {
       "github": "git@github.com:valor-software/ddf--gapminder_world-stub-1.git",
       "dataset": "ddf--gapminder_world-stub-1",
       "commit": "aafed7d4dcda8d736f317e0cd3eaff009275cbb6"
     }
*/

wsRequest.prototype.getLatestCommit = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_GET, ROUTE_WS_LATEST_COMMIT, data, callback);
};

/*

  Request to WS :: Incremental update

  GET: /api/ddf/cli/update-incremental

  @param path, String         [/full/path/to/output_file.json]
  @param githubUrl, String    [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]

  RESPONSE, data: not provided

*/

wsRequest.prototype.updateDataset = function (data, callback) {
  this.sendRequest(REQUEST_TYPE_POST, ROUTE_WS_UPDATE, data, callback);
  //this.sendStream(ROUTE_WS_UPDATE, data, callback);
};



/* Internal */

wsRequest.prototype.configureSource = function (path) {
  let wsSource = holder.get(HOLDER_KEY_WS_SOURCE, '');
  wsSource = this._configureSource(wsSource);
  return wsSource + path;
};

wsRequest.prototype._configureSource = function (wsSource) {

  // detect is that localhost

  if (wsSource.indexOf('localhost') !== -1) {
    return wsSource;
  }

  // detect if that IP

  const match = wsSource.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/im);
  const wsSourceFixed = match[1] || wsSource;

  const address4 = new Address4(wsSourceFixed);
  const address6 = new Address6(wsSourceFixed);

  if (address4.isValid() || address6.isValid()) {
    return wsSource;
  }

  // other cases - add 'import' prefix to host

  return wsSource.replace(wsSourceFixed, 'import-' + wsSourceFixed);
}

wsRequest.prototype.addToken = function (path) {

  let tokenData = holder.load(HOLDER_KEY_TOKEN, false);

  if(!tokenData) {
    return path;
  }

  return path + '?' + REQUEST_TOKEN_PARAM + '=' + encodeURIComponent(tokenData.token);
};

/*

  sendRequest, method POST

  @param rType, Boolean [True|False]
  @param ROUTE_WS, String
  @param data, Object
  @param callback, Function

*/

wsRequest.prototype.sendRequest = function (rType, ROUTE_WS, data, callback) {

  let requestInstance;

  // validate value between get|post
  rType = rType != REQUEST_TYPE_GET ? REQUEST_TYPE_POST : rType;

  ROUTE_WS = this.addToken(ROUTE_WS);
  ROUTE_WS = this.configureSource(ROUTE_WS);

  if(rType == REQUEST_TYPE_GET) {
    requestInstance = request.get(ROUTE_WS).query(data);
  } else {
    requestInstance = request.post(ROUTE_WS).type('form').send(data);
  }

  requestInstance.timeout(REQUEST_TIMEOUT)
    .end(function(error, response){

      /*
      log_file.write('\n**************************\n');
      log_file.write('REQUEST: ' + util.format(ROUTE_WS) + '\n');
      log_file.write('ERROR: ' + util.format(error) + '\n');
      log_file.write('RESPONSE: ' + util.format(response) + '\n');
      */

      callback(error, new wsResponse(response));
    });

};

/*

 !!! Deprecated, was used for Incremental Update

 sendStream, method POST with Streaming

 @param ROUTE_WS, String
 @param data, Object
 @param callback, Function

 */

wsRequest.prototype.sendStream = function (ROUTE_WS, data, callback) {

  let objectStream = JSONStream.stringify();

  ROUTE_WS = this.addToken(ROUTE_WS);
  ROUTE_WS = this.configureSource(ROUTE_WS);

  let requestInstance = request
    .post(ROUTE_WS)
    .timeout(REQUEST_TIMEOUT);

  requestInstance.on('response',   function (response){
    callback(false, new wsResponse(response));
  });

  objectStream.pipe(requestInstance);

  for(let fileName in data.diff.changes) {

    //let sliced = data.diff.slice(j, 100000);

    let changes = {};
    changes[fileName] = data.diff.changes[fileName];

    objectStream.write({
      commit: data.commit,
      github: data.github,
      diff: {
        changes: changes
      }
    });
  }

  objectStream.end();
};



// Export Module

module.exports = new wsRequest();