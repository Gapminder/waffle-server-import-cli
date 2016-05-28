'use strict';

const stepBase = require('./../model/base-step');
const util = require('util');
const cliProgress = require('./../service/ui-progress');
const inquirer = require('inquirer');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

// Question Definition

const sourceList = require('./../service/github-repo');

let question = {
  'name': 'flow-import-dataset-choose',
  'type': 'list',
  'message': 'List of DataSet Repositories (github.com)',
  'choices': [
    {
      name: `${sourceList[0].github} | ${sourceList[0].commit.slice(0, 9)}`,
      value: 0,
    },
    {
      name: `${sourceList[1].github} | ${sourceList[1].commit.slice(0, 9)}`,
      value: 1,
    },
    new inquirer.Separator(),
    'Back'
  ]
};

// Own Process Implementation

const holder = require('./../model/value-holder');
const request = require('request-defaults');

step.prototype.process = function (inputValue) {

  let done = this.async();

  if(!!sourceList[inputValue]) {

    cliProgress.state("processing import with selected DataSet '" + sourceList[inputValue].folder + "'");

    /*

      Request to WS :: Import Dataset

      GET: /api/ddf/import/repo

        PARAM: github,    [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]
        PARAM: commit,    [aafed7d4dcda8d736f317e0cd3eaff009275cbb6]

    */

    // TODO:: Update with Real path to WS
    let CHANGE_ROUTE_WS_IMPORT = 'http://localhost:3000/api/ddf/demo/import-dataset';

    let data = {
      'github': sourceList[inputValue].github,
      'commit': sourceList[inputValue].commit
    };

    request.api.post(
      CHANGE_ROUTE_WS_IMPORT,
      {form: data},
      function (error, response, body) {
        question.choices[inputValue]['disabled'] = "done";
        cliProgress.stop();
        done(null, true);
      }
    );

  } else {
    cliProgress.stop();
    done(null, true);
  }

};

// Export Module

module.exports = new step(question);
