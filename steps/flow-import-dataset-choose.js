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
var inquirerUi = new inquirer.ui.BottomBar();

var intervalId;
var consoleState = 'Loading: ';

step.prototype.process = function (inputValue) {

  var done = this.async();

  if(!!sourceList[inputValue]) {

    // /api/ddf/import/repo?github=git@github.com:valor-software/ddf--gapminder_world-stub-1.git&commit=aafed7d4dcda8d736f317e0cd3eaff009275cbb6

    var consoleProgress = '';
    intervalId = setInterval(function(){
      consoleProgress += '.';
      inquirerUi.updateBottomBar(consoleState + consoleProgress);
    }, 500);

    request.api.get(
      'http://localhost:3010/ws-import-dataset',
      {form: sourceList[inputValue]},
      function (error, response, body) {
        question.choices[inputValue]['disabled'] = "done";
        clearInterval(intervalId);
        done(null, true);
      }
    );

  } else {
    done(null, true);
  }

};

/**************************************************************************************************************/

module.exports = new step(question);
