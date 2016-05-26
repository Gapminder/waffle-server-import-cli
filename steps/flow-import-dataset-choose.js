'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var inquirer = require('inquirer');

var sourceList = [
  {
    github: 'git@github.com:valor-software/ddf--gapminder_world-stub-1.git',
    commit: 'aafed7d4dcda8d736f317e0cd3eaff009275cbb6'
  },
  {
    github: 'git@github.com:valor-software/ddf--gapminder_world-stub-2.git',
    commit: 'e4eaa8ef84c7f56325f86967351a7004cb175651'
  }
];

var question = {
  'name': 'flow-import-dataset-choose',
  'type': 'list',
  'message': 'List of DataSet Repositories (github.com)',
  'choices': [
    {
      name: sourceList[0].github,
      value: 0,
    },
    {
      name: sourceList[1].github,
      value: 1,
    },
    new inquirer.Separator(),
    'Back'
  ]
};

/**************************************************************************************************************/

var holder = require('./../model/value-holder');
var request = require('request-defaults');
var cliProgress = require('./../service/ui-progress');


var intervalId;
var consoleState = 'Loading: ';

step.prototype.process = function (inputValue) {

  var done = this.async();

  if(!!sourceList[inputValue]) {

    /*

      Request to WS :: Import Dataset

      GET: /api/ddf/import/repo

        PARAM: github,    [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]
        PARAM: commit,    [aafed7d4dcda8d736f317e0cd3eaff009275cbb6]

    */

    let CHANGE_ROUTE_WS_IMPORT = 'http://localhost:3010/ws-import-dataset';

    cliProgress.start();
    request.api.get(
      CHANGE_ROUTE_WS_IMPORT,
      {form: sourceList[inputValue]},
      function (error, response, body) {
        question.choices[inputValue]['disabled'] = "done";
        cliProgress.stop();
        done(null, true);
      }
    );

  } else {
    done(null, true);
  }

};

/**************************************************************************************************************/

module.exports = new step(question);
