'use strict';

const fs = require('fs');
const path = require('path');
const envConst = require('./../model/env-const');

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

  // check location for Config Files
  if(!fs.existsSync(envConst.PATH_CONFIG)) {

    fs.mkdirSync(envConst.PATH_CONFIG);

    let configFileRepositoriesBase = path.join(envConst.PATH_APP_BASE, "config", "repositories.json");
    let configFileEndpointsBase = path.join(envConst.PATH_APP_BASE, "config", "waffle-server.json");

    let dataListRepos = fs.readFileSync(configFileRepositoriesBase);
    fs.writeFileSync(configFileRepositoriesTarget, dataListRepos);

    let dataListWS = fs.readFileSync(configFileEndpointsBase);
    fs.writeFileSync(configFileEndpointsTarget, dataListWS);
  }

  // setup ready file path consts
  envConst['PATH_FILE_REPOS'] = configFileRepositoriesTarget;
  envConst['PATH_FILE_WS'] = configFileEndpointsTarget;
};

module.exports = new envInit();
