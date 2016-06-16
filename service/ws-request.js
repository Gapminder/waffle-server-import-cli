'use strict';

const request = require('superagent');
const JSONStream = require('JSONStream');

const WS_HOST = 'http://localhost:3000';
//const WS_HOST = 'http://192.168.1.98:3000';

const ROUTE_WS_PRESTORED_QUERY = WS_HOST + '/api/ddf/cli/prestored-queries';
const ROUTE_WS_IMPORT = WS_HOST + '/api/ddf/cli/import-dataset';
const ROUTE_WS_LATEST_COMMIT = WS_HOST + '/api/ddf/cli/commit-of-latest-dataset-version';
const ROUTE_WS_UPDATE = WS_HOST + '/api/ddf/cli/update-incremental';

//const REQUEST_TIMEOUT = 2 * 60 * 60 * 1000;
// Linux kernel TCP :: max 120 seconds
const REQUEST_TIMEOUT = 150 * 1000;

function wsRequest() {};

/*

 Request to WS :: Import Dataset

 GET: /api/ddf/prestored-query

 PARAM: github,    [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]
 PARAM: commit,    [aafed7d4dcda8d736f317e0cd3eaff009275cbb6]

 RESPONSE: Array,    [http://localhost:3000/api/ddf/stats?dataset=57470620cef40f3d23cda175&version=1464272416303&time=1800:2015&select=geo,time,sg_population,energy_use_total,...]

*/

wsRequest.prototype.getPrestoredQueries = function (data, callback) {
  this.sendRequest('get', ROUTE_WS_PRESTORED_QUERY, data, callback);
};

/*

 Request to WS :: Import Dataset

 GET: /api/ddf/import/repo

 PARAM: github,    [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]
 PARAM: commit,    [aafed7d4dcda8d736f317e0cd3eaff009275cbb6]

*/

wsRequest.prototype.importDataset = function (data, callback) {
  this.sendRequest('post', ROUTE_WS_IMPORT, data, callback);
};

/*

 Request to WS :: Get Latest commit hash

 GET: /api/ddf/demo/commit-of-latest-dataset-version

 PARAM: github,    [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]

 RESPONSE, JSON

     {
       "github": "git@github.com:valor-software/ddf--gapminder_world-stub-1.git",
       "dataset": "ddf--gapminder_world-stub-1",
       "commit": "aafed7d4dcda8d736f317e0cd3eaff009275cbb6"
     }
 */

wsRequest.prototype.getLatestCommit = function (data, callback) {
  this.sendRequest('get', ROUTE_WS_LATEST_COMMIT, data, callback);
};

/*

 Request to WS :: Incremental update

 GET: /api/ddf/incremental-update/repo

 PARAM: path,        [/full/path/to/output_file.json]
 PARAM: githubUrl,   [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]

 */

wsRequest.prototype.updateDataset = function (data, callback) {
  this.sendStream(ROUTE_WS_UPDATE, data, callback);
  //this.sendRequest('post', ROUTE_WS_UPDATE, data, callback);
};



/* Internal */

/*
 * sendRequest, method POST
 *
 * @param ROUTE_WS
 * @param data
 * @param callback
 *
 */

wsRequest.prototype.sendRequest = function (rType, ROUTE_WS, data, callback) {

  if(rType == 'get') {

    request
      .get(ROUTE_WS)
      .query(data)
      .timeout(REQUEST_TIMEOUT)
      .end(function(error, response){
        let responseBody = response && response.body ? response.body : '';
        callback(error, responseBody);
      });

  } else {

    request
      .post(ROUTE_WS)
      .type('form')
      .send(data)
      .timeout(REQUEST_TIMEOUT)
      .end(function(error, response){
        let responseBody = response && response.body ? response.body : '';
        callback(error, responseBody);
      });

  }

};

wsRequest.prototype.sendStream = function (ROUTE_WS, data, callback) {

  var objectStream = JSONStream.stringify();

  let requestInst = request
    .post(ROUTE_WS)
    .timeout(REQUEST_TIMEOUT);

  requestInst.on('response',   function (response){
    let responseBody = response && response.body ? response.body : '';
    callback(false, responseBody);
  });

  objectStream.pipe(requestInst);
  //console.log("\n");

  for(let fileName in data.diff.changes) {

    //let sliced = data.diff.slice(j, 100000);

    let changes = {};
    changes[fileName] = data.diff.changes[fileName];
    //console.log("streaming:", fileName);

    objectStream.write({
      commit: data.commit,
      github: data.github,
      diff: {
        changes: changes
      }
    });
  }

  //console.log("\n\n\n\n\n\n\n\n");
  objectStream.end();
};



// Export Module

module.exports = new wsRequest();