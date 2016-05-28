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

let question = {
  'name': 'choose-flow',
  'type': 'list',
  'message': 'Choose Flow',
  'default': 0,
  'choices': [
    {
      name: 'Import DataSet',
      value: 1
    },
    {
      name: 'Update DataSet',
      value: 2
    },
    {
      name: 'Results Overview',
      value: 3
    },
    /*
    {
      name: 'Import Translations',
      value: 3,
      disabled: 'disabled'
    },
    {
      name: 'Publish DataSet',
      value: 4,
      disabled: 'disabled'
    },
    */
    new inquirer.Separator(),
    'Exit'
  ]
};

// Own Process Implementation

const holder = require('./../model/value-holder');
const request = require('request-defaults');

step.prototype.process = function (inputValue) {
  
  let done = this.async();
  cliProgress.state("processing user choice");

  if(inputValue == 4) {

    cliProgress.state("publish dataset in progress ...");

    request.api.post(
      'http://localhost:3010/get-data-set-non-published',
      //{form: data},
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          if(body) {
            let datasetsReady = body.map(function(value) {
              return value.dsId;
            });
            holder.setResult('publish-dataset-non-published', datasetsReady);
            cliProgress.stop();
            done(null, true);
          } else {
            cliProgress.stop();
            done(null, 'Non-published Data Sets were not found.');
          }
        } else {
          cliProgress.stop();
          done(null, 'Server Error. Please try again later.');
        }
      }
    );

  // Results Overview
  } else if (inputValue == 3) {

    /*

      Request to WS :: Import Dataset

      GET: /api/ddf/prestored-query

        PARAM: github,    [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]
        PARAM: commit,    [aafed7d4dcda8d736f317e0cd3eaff009275cbb6]

      RETURN: Array,    [http://localhost:3000/api/ddf/stats?dataset=57470620cef40f3d23cda175&version=1464272416303&time=1800:2015&select=geo,time,sg_population,energy_use_total,...]

    */

    // TODO:: Update with Real path to WS - done
    let CHANGE_ROUTE_WS_PRESTORED_QUERY = 'http://localhost:3000/api/ddf/demo/prestored-queries';

    request.api.get(
      CHANGE_ROUTE_WS_PRESTORED_QUERY,
      //{form: data},
      function (error, response, body) {

        console.log("\n----------------------------------------\n");
        body.forEach(function(item) {
          console.log("> ", item);
        });
        console.log("\n----------------------------------------\n\n\n\n\n");

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
