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
const _ = require('lodash');
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
            /*
             "hash": "5412b8bd341ec69475ad3678ffd217aae7bb699e",
             "date": "2016-05-25 17:44:41 +0300",
             "message": "feat(stub-data): update stub data for dataset 1 (version 3) (HEAD, origin/master, origin/HEAD, master)",
             "author_name": "Oleksandra korel Kalinina",
             "author_email": "korery@gmail.com"
             */

            holder.setResult('flow-update-dataset-choose', body.commits.map(commit => {
              // hash (8 symbols) | date | author_email
              let nameCli = `${_.take(commit.hash, 8).join('')} | ${_.chain(commit.date).split(" ").take(2).join(" ").value() } | ${commit.author_email} | ${commit.message}`;
              return {name: nameCli, value: commit.hash}
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
