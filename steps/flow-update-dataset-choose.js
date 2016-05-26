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
    folder: 'ddf--gapminder_world-stub-1'
  },
  {
    github: 'git@github.com:valor-software/ddf--gapminder_world-stub-2.git',
    folder: 'ddf--gapminder_world-stub-2'
  }
];

var question = {
  'name': 'flow-update-dataset-choose',
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
require('shelljs/global');

step.prototype.process = function (inputValue) {

  var done = this.async();

  if(!!sourceList[inputValue]) {

    holder.setResult('flow-update-selected-repo', sourceList[inputValue]);
    var res = exec("cd ../" + sourceList[inputValue].folder, {silent: true});

    // folder not found
    if(!!res.stderr) {
      exec("cd ../ && git clone " + sourceList[inputValue].github, {silent: true});
    }

    request.api.post(
      'http://localhost:3010/get-data-set-for-update',
      {form: sourceList[inputValue]},
      function (error, response, body) {

        if (!error && response.statusCode == 200) {
          if(body) {
            holder.setResult('flow-update-dataset-choose', body.list);
            done(null, true);
          } else {
            done(null, 'No Data were found on Server Side.');
          }
        } else {
          done(null, 'Server Error. Please try again later.');
        }
      }
    );

  } else {
    done(null, true);
  }

};

/**************************************************************************************************************/

module.exports = new step(question);
