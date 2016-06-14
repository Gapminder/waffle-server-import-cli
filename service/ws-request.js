'use strict';

const request = require('request-defaults');

const ROUTE_WS_PRESTORED_QUERY = 'http://localhost:3000/api/ddf/demo/prestored-queries';
const ROUTE_WS_IMPORT = 'http://localhost:3000/api/ddf/demo/import-dataset';
const ROUTE_WS_LATEST_COMMIT = 'http://localhost:3000/api/ddf/demo/commit-of-latest-dataset-version';
const ROUTE_WS_UPDATE = 'http://localhost:3000/api/ddf/demo/update-incremental';

function wsRequest() {};

/*

 Request to WS :: Import Dataset

 GET: /api/ddf/prestored-query

 PARAM: github,    [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]
 PARAM: commit,    [aafed7d4dcda8d736f317e0cd3eaff009275cbb6]

 RESPONSE: Array,    [http://localhost:3000/api/ddf/stats?dataset=57470620cef40f3d23cda175&version=1464272416303&time=1800:2015&select=geo,time,sg_population,energy_use_total,...]

*/

wsRequest.prototype.getPrestoredQueries = function (data, callback) {
  this.sendRequestPost(ROUTE_WS_PRESTORED_QUERY, data, callback);
};

/*

 Request to WS :: Import Dataset

 GET: /api/ddf/import/repo

 PARAM: github,    [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]
 PARAM: commit,    [aafed7d4dcda8d736f317e0cd3eaff009275cbb6]

*/

wsRequest.prototype.importDataset = function (data, callback) {
  this.sendRequestPost(ROUTE_WS_IMPORT, data, callback);
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
  this.sendRequestGet(ROUTE_WS_LATEST_COMMIT, data, callback);
};

/*

 Request to WS :: Incremental update

 GET: /api/ddf/incremental-update/repo

 PARAM: path,        [/full/path/to/output_file.json]
 PARAM: githubUrl,   [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]

 */

wsRequest.prototype.updateDataset = function (data, callback) {
  this.sendRequestPost(ROUTE_WS_UPDATE, data, callback);
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

wsRequest.prototype.sendRequestPost = function (ROUTE_WS, data, callback) {

  request.api.post(
    ROUTE_WS,
    {form: data},
    function (error, response, body) {
      callback(error, response, body);
    }
  );

};

/*
 * sendRequest, method GET
 *
 * @param ROUTE_WS
 * @param data
 * @param callback
 *
 */

wsRequest.prototype.sendRequestGet = function (ROUTE_WS, data, callback) {

  const ROUTE_WS_GET = this.generateGetUrl(ROUTE_WS, data);

  request.api.get(
    ROUTE_WS_GET,
    function (error, response, body) {
      callback(error, response, body);
    }
  );

};

/*
 * generateGetUrl
 *
 * @param ROUTE_WS
 * @param data
 *
 * @return String, ready get url
 *
 */

wsRequest.prototype.generateGetUrl = function (ROUTE_WS, data) {

  let params = [];
  for(let key in data) {
    params.push(key + "=" + data[key]);
  }

  return ROUTE_WS + "?" + params.join("&");
};



// Export Module

module.exports = new wsRequest();