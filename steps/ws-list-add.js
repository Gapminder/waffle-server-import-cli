'use strict';

const util = require('util');
const cliUi = require('./../service/cli-ui');
const inquirer = require('inquirer');
const stepBase = require('./../model/base-step');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

let question = {
  'name': 'ws-list-add',
  'type': 'input',
  'message': 'Add new Waffle Server Source'
};

// Own Process Implementation

const _ = require('lodash');
const fs = require('fs');
const url = require("url");
const path = require("path");

const CONFIG_FILE_WS = path.resolve(__dirname, "./../config/waffle-server.json");
const HOLDER_KEY_WS_LIST = 'waffle-server-list';

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliUi.state("add waffle server source");

  // https?:\/\/(www\.)?([-a-zA-Z0-9@%._\+~#=]{2,256})([:]{1})?([0-9]{2,5})?([-a-zA-Z0-9@:%_\+.~#?&/=]*)?

  // Validate Input

  const urlInput = _.trim(inputValue);
  const urlParse = url.parse(urlInput);

  if(!urlParse.hostname) {
    cliUi.stop();
    return done(null, "Invalid source URL");
  }

  // Register new Source

  let wsList = stepInstance.holder.load(HOLDER_KEY_WS_LIST, []);
  let wsListJsonRaw = fs.readFileSync(CONFIG_FILE_WS);
  let wsListJson = JSON.parse(wsListJsonRaw);

  let wsExists = _.find(wsListJson, function(item) {
    return item.url == urlInput;
  });

  if(!wsExists) {

    let wsListAdd = {
      "url": urlInput,
      "name": urlParse.hostname
    };    
    
    wsList.push(wsListAdd);
    stepInstance.holder.save(HOLDER_KEY_WS_LIST, wsListJson);

    wsListJson.push(wsListAdd);
    fs.writeFileSync(CONFIG_FILE_WS, JSON.stringify(wsListJson));
  }

  cliUi.stop();
  done(null, true);
};

// Export Module and keep Context available for process (inquirer ctx)

let stepInstance = new step(question);
module.exports = stepInstance;