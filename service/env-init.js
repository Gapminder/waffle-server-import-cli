'use strict';

const fs = require('fs');
const path = require('path');
const envConst = require('./../model/env-const');
const {reposService} = require('waffle-server-repo-service');
reposService.logger = require('../config/logger');

let envInit = function () {

  // check location for Requests
  if(!fs.existsSync(envConst.PATH_REQUESTS)) {
    fs.mkdirSync(envConst.PATH_REQUESTS);
  }

  // check location for Repositories
  if(!fs.existsSync(envConst.PATH_REPOS)) {
    fs.mkdirSync(envConst.PATH_REPOS);
  }

  let configFileRepositoriesTarget = path.join(envConst.PATH_CONFIG, "repositories.json");
  let configFileEndpointsTarget = path.join(envConst.PATH_CONFIG, "waffle-server.json");
  let logFileDebug = path.join(envConst.PATH_CONFIG, "debug.response.log");

  // check location for Config Files
  if(!fs.existsSync(envConst.PATH_CONFIG)) {
    fs.mkdirSync(envConst.PATH_CONFIG);
  }

  // check that base file from sample created (repositories)
  if(!fs.existsSync(configFileRepositoriesTarget)) {
    let configFileRepositoriesBase = path.join(envConst.PATH_APP_BASE, "config", "sample.repositories.json");
    let dataListRepos = fs.readFileSync(configFileRepositoriesBase);
    fs.writeFileSync(configFileRepositoriesTarget, dataListRepos);
  }

  // check that base file from sample created (waffle-server)
  if(!fs.existsSync(configFileEndpointsTarget)) {
    let configFileEndpointsBase = path.join(envConst.PATH_APP_BASE, "config", "sample.waffle-server.json");
    let dataListWS = fs.readFileSync(configFileEndpointsBase);
    fs.writeFileSync(configFileEndpointsTarget, dataListWS);
  }

  // setup ready file path consts
  envConst['PATH_FILE_REPOS'] = configFileRepositoriesTarget;
  envConst['PATH_FILE_WS'] = configFileEndpointsTarget;
  envConst['PATH_FILE_DEBUG'] = logFileDebug;
};

module.exports = new envInit();
