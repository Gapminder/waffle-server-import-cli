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
    {
      name: sourceList[2].github,
      value: 2,
    },
    new inquirer.Separator(),
    'Back'
  ]
};

// Own Process Implementation

const holder = require('./../model/value-holder');
const request = require('request-defaults');
require('shelljs/global');

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliProgress.state("processing GIT, getting commit list");

  if(!!sourceList[inputValue]) {

    holder.setResult('flow-update-selected-repo', sourceList[inputValue]);

    let data = {
      'github': sourceList[inputValue].github
    };

    request.api.post(
      'http://localhost:3000/api/ddf/demo/git-commits-list',
      {form: data},
      function (error, response, body) {
        if (!error) {
          if(body) {
            holder.setResult('flow-update-dataset-choose', body.commits.map(commit => {
              return {name: commit, value: commit}
            }));
            cliProgress.stop();
            done(null, true);
          } else {
            cliProgress.stop();
            done(null, 'No Data were found on Server Side.');
          }
        } else {
          cliProgress.stop();
          done(null, 'Server Error. Please try again later.');
        }
      }
    );

  } else {
    cliProgress.stop();
    done(null, true);
  }

};

// Export Module

module.exports = new step(question);
