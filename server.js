'use strict';

require('shelljs/global');

const http = require('http');
const Router = require('router');
const qs = require('querystring');
const fs = require('fs');

let router = Router();

const SERVER_TIMEOUT_MIN = 2500;
const SERVER_TIMEOUT_MAX = 4500;
const DEBUG = true;

function _log() {
  console.log("\n");
  console.log.apply(console, arguments);
}
function _debug() {
  if(DEBUG) {
    console.log.apply(console, arguments);
  }
}

router.get("/ws-import-dataset", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {

    let params = qs.parse(dataRequest);

    _log("ws-import-dataset::ok");
    _debug("Request: ", params);

    setTimeout(function(){

      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({}));

    }, SERVER_TIMEOUT_MAX);

  });
});

router.post("/generate-commit-list", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {

    let params = qs.parse(dataRequest);

    let githubUrl = params['github'];
    let regexpFolder = /\/(.+)\.git/;
    let regexpFolderRes = regexpFolder.exec(githubUrl);
    let gitFolder = regexpFolderRes[1];

    let resultExec = exec("cd ../" + gitFolder, {silent: true});

    // folder not found
    if(!!resultExec.stderr) {
      exec("cd ../ && git clone " + githubUrl, {silent: true});
    }

    let gitFolderDirParam = '--git-dir=./../' + gitFolder + '/.git';
    let commandGitCmd = 'git ' + gitFolderDirParam + ' log --oneline';
    let resultGitCmd = exec(commandGitCmd, {silent: true}).stdout;

    let commitList = resultGitCmd.split("\n").filter(function(value){
      return !!value;
    }).map(function(value){
      return {
        name: value,
        value: value
      };
    });

    let data = {
      'list': commitList
    };

    _log("get-data-set-for-update::ok");
    _debug("Request: ", params);
    _debug("Response: ", commitList);

    setTimeout(function(){

      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(data));

    }, SERVER_TIMEOUT_MIN);

  });
});

router.get("/ws-update-incremental", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {

    let params = qs.parse(dataRequest);

    _log("ws-update-incremental::ok", params);
    _debug("Request: ", params);

    setTimeout(function(){

      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({}));

    }, SERVER_TIMEOUT_MAX);

  });
});

router.get("/ws-prestored-query", function (request, response) {

  let dataRequest = '';
  request.on('data', function(chunk) {
    dataRequest += chunk;
  });
  request.on('end', function() {

    let params = qs.parse(dataRequest);

    _log("ws-prestored-query::ok", params);
    _debug("Request: ", params);

    let data = {
      'list': [
        'http://lmgtfy.com/?q=first+query',
        'http://lmgtfy.com/?q=second+query'
      ]
    };

    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(data));

  });
});

let server = http.createServer(function(req, res) {
  router(req, res, function(req, res) {
  });
})

server.listen(3010);