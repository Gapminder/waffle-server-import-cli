'use strict';

var stepBase = require('./../model/base-step');
var util = require('util');

function step() {
  stepBase.apply(this, arguments);
}

util.inherits(step, stepBase);

/**************************************************************************************************************/

var inquirer = require('inquirer');

var question = {
  'name': 'flow-import-dataset-update-hash-to',
  'type': 'list',
  'message': 'Git commit, state TO',
  'choices': []
};

/**************************************************************************************************************/

require('shelljs/global');

const holder = require('./../model/value-holder');
const daff = require('daff');


step.prototype.process = function (inputValue) {
  var done = this.async();

  /* STEP :: prepare data, find hashes */
  
  var answerHashFrom = holder.get('flow-import-dataset-update-hash-from', false);
  var answerHashTo = inputValue;

  var hashFrom = answerHashFrom.split(" ")[0];
  var hashTo = answerHashTo.split(" ")[0];

  /* STEP :: get diff by hashes */

  var gitFolder = '--git-dir=./../temp-ddf-csv-dummy-data/.git';
  var commandGitDiff = 'git ' + gitFolder + ' diff ' + hashFrom + '..' + hashTo + ' --name-only';
  var resultGitDiff = exec(commandGitDiff, {silent: true}).stdout;

  var gitDiffFileList = resultGitDiff.split("\n").filter(function(value){
    return !!value;
  });

  gitDiffFileList.forEach(function(fileName, index){

    console.log("File #" + index, fileName);

    var diffResult = [];
    var commandGitShowFrom = 'git ' + gitFolder + ' show ' + hashFrom + ':' + fileName;
    var commandGitShowTo = 'git ' + gitFolder + ' show ' + hashTo + ':' + fileName;

    const fileDataFrom = exec(commandGitShowFrom, {silent: true}).stdout;
    const fileDataTo = exec(commandGitShowTo, {silent: true}).stdout;

    const tableFrom = new daff.Csv().makeTable(fileDataFrom);
    const tableTo = new daff.Csv().makeTable(fileDataTo);

    var filesDiff = daff.compareTables(tableFrom,tableTo).align();

    var flags = new daff.CompareFlags();
    flags.show_unchanged = true;

    var highlighter = new daff.TableDiff(filesDiff, flags);
    highlighter.hilite(diffResult);

    console.log("****************");
    console.log(diffResult);
    console.log("****************");

    sleep(10000);
  });

  // git diff 9f2e28d 5a4cacb --name-only
  // git show 5a4cacb:output/ddf-full-stub/ddf--concepts.csv

  setTimeout(function () {
    done(null, true);
  }, 10000);
};

// Define Hook

step.prototype.prepare = function () {
  var prevStepResult = holder.getResult('flow-import-dataset-choose', []);
  this.step.choices = prevStepResult;
};

/**************************************************************************************************************/

module.exports = new step(question);



function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}