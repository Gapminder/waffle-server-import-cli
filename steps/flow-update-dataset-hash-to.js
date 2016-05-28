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
  'name': 'flow-import-dataset-update-hash-to',
  'type': 'list',
  'message': 'Git commit, state TO',
  'choices': []
};

// Own Process Implementation

require('shelljs/global');

const holder = require('./../model/value-holder');
const daff = require('daff');
const fs = require('fs');
const request = require('request-defaults');

step.prototype.process = function (inputValue) {

  let done = this.async();
  cliProgress.state("processing CSV-diff");

  /* STEP :: prepare data, find hashes */
  
  let answerHashFrom = holder.get('flow-import-dataset-update-hash-from', false);
  let answerHashTo = inputValue;

  let hashFrom = answerHashFrom.split(" ")[0];
  let hashTo = answerHashTo.split(" ")[0];

  /* STEP :: get diff by hashes */

  let sourceFolder = holder.getResult('flow-update-selected-repo', '').folder;
  let sourceUrl = holder.getResult('flow-update-selected-repo', '').github;

  // clone repo locally

  let resultExec = exec("cd ../" + sourceFolder, {silent: true});
  // folder not found
  if(!!resultExec.stderr) {
    exec("cd ../ && git clone " + sourceUrl, {silent: true});
  }

  let gitFolder = '--git-dir=./../' + sourceFolder + '/.git';

  exec("git " + gitFolder + " pull origin master", {silent: true});

  let commandGitDiff = 'git ' + gitFolder + ' diff ' + hashFrom + '..' + hashTo + ' --name-only';
  let resultGitDiff = exec(commandGitDiff, {silent: false}).stdout;

  let gitDiffFileList = resultGitDiff.split("\n").filter(function(value){
    return !!value && value.indexOf(".csv") != -1;
  });

  let commandGitDiffByFiles = 'git ' + gitFolder + ' diff ' + hashFrom + '..' + hashTo + ' --name-status';
  let resultGitDiffByFiles = exec(commandGitDiffByFiles, {silent: false}).stdout;

  let gitDiffFileStatus = {};
  resultGitDiffByFiles.split("\n").filter(function(value) {
    return !!value && value.indexOf(".csv") != -1;
  }).map(function(rawFile) {
    let fileStat = rawFile.split("\t");
    gitDiffFileStatus[fileStat[1]] = fileStat[0];
  });

  let dataRequest = {};

  gitDiffFileList.forEach(function(fileName, index){

    // disable changes for removed files
    /*
    if(gitDiffFileStatus[fileName] && gitDiffFileStatus[fileName] == "D") {
      return;
    }
    */

    cliProgress.state("processing CSV-diff, file: " + fileName);

    let diffResult = [];
    let commandGitShowFrom = 'git ' + gitFolder + ' show ' + hashFrom + ':' + fileName;
    let commandGitShowTo = 'git ' + gitFolder + ' show ' + hashTo + ':' + fileName;

    const fileDataFrom = exec(commandGitShowFrom, {silent: true}).stdout;
    const fileDataTo = exec(commandGitShowTo, {silent: true}).stdout;

    const tableFrom = new daff.Csv().makeTable(fileDataFrom);
    const tableTo = new daff.Csv().makeTable(fileDataTo);

    let filesDiff = daff.compareTables(tableFrom,tableTo).align();

    let flags = new daff.CompareFlags();
    flags.show_unchanged = true;
    flags.show_unchanged_columns = true;
    flags.always_show_header = true;

    let highlighter = new daff.TableDiff(filesDiff, flags);
    highlighter.hilite(diffResult);

    fs.writeFileSync("./requests/diff--" + fileName + ".json", JSON.stringify(diffResult));

    /* Prepare Data Structure */

    let fileDiffData = {

      "header": {
        "create": [],
        "remove": [],
        "update": []
      },

      "body": {
        "create": [],
        "remove": [],
        "update": [],
        "change": []
      }

    };



    /* Slice Groupd of Changes */

    let firsDiffRow = diffResult.shift();
    let diffResultHeader = [];
    let diffResultColumns = [];

    if(firsDiffRow[0] == '!') {

      // [ '!', '', '(old_column)', '+++', '---' ],
      diffResultHeader = firsDiffRow;
      // [ '@@', 'city', 'name', 'country' ],
      diffResultColumns = diffResult.shift();

      if(diffResultHeader[0] == "!") {

        diffResultHeader.shift();
        diffResultHeader.forEach(function(value, index){

          if(value != '') {

            if (value == '+++') {
              // added
              fileDiffData.header.create.push(diffResultColumns[index + 1]);
            } else if (value == '---') {
              // removed
              fileDiffData.header.remove.push(diffResultColumns[index + 1]);
            } else {
              // modified
              let oldColumn = value.substring(1, value.length - 1);
              fileDiffData.header.update.push({
                oldColumn: diffResultColumns[index + 1]
              });
            }
          }

        });
      }      

    } else {
      // [ '@@', 'city', 'name', 'country' ],
      diffResultColumns = firsDiffRow;
    }

    let diffResultGidField;
    if(diffResultColumns[0] == "@@") {
      diffResultColumns.shift();
      diffResultGidField = diffResultColumns[0];
    }

    let isDataPointsFile = fileName.indexOf("--datapoints--") != -1 ? true : false;


    if(diffResult.length) {

      diffResult.forEach(function(value, index){

        // simple-way, collect all data (mean full row) for update

        let modificationType = value.shift();

        if(modificationType != '') {

          if (modificationType == '+++') {

            // added
            let dataRow = {};
            diffResultColumns.forEach(function(columnValue, columnIndex){
              if(fileDiffData.header.remove.indexOf(columnValue) == -1) {
                // ready columns
                dataRow[columnValue] = value[columnIndex];
              }
            });

            if(dataRow) {
              fileDiffData.body.create.push(dataRow);
            }

          } else if (modificationType == '---') {

            // removed
            let dataRowRemoved = {};

            // check that file with datapoints
            if(isDataPointsFile) {
              diffResultColumns.forEach(function(columnValue, columnIndex){
                if(
                    // disable changes for removed files
                    // fileDiffData.header.remove.indexOf(columnValue) == -1 &&
                    fileDiffData.header.create.indexOf(columnValue) == -1
                ) {
                  // ready columns
                  dataRowRemoved[columnValue] = value[columnIndex];
                }
              });
            } else {
              dataRowRemoved[diffResultGidField] = value[0];
            }

            fileDiffData.body.remove.push(dataRowRemoved);

          } else if (modificationType == '+') {

            // updated, only added columns
            let dataRow = {};
            let dataRowOrigin = {};
            diffResultHeader.forEach(function(columnValue, columnIndex) {
              let columnKey = diffResultColumns[columnIndex];
              if (fileDiffData.header.create.indexOf(columnKey) != -1) {
                dataRow[columnKey] = value[columnIndex];
              } else {
                dataRowOrigin[columnKey] = value[columnIndex];
              }
            });

            let dataRowUpdated = {};
            dataRowUpdated["gid"] = diffResultGidField;
            dataRowUpdated[diffResultGidField] = value[0];
            dataRowUpdated["data-update"] = dataRow;

            if(isDataPointsFile) {
              dataRowUpdated["data-origin"] = dataRowOrigin;
            }

            fileDiffData.body.update.push(dataRowUpdated);

          } else if (modificationType == '->') {

            // updated, only changed cell
            let dataRow = {};
            let dataRowOrigin = {};

            value.forEach(function(valueCell, indexCell){
              let modificationSeparatorPosition = valueCell.indexOf('->');
              let columnKey = diffResultColumns[indexCell];

              if(modificationSeparatorPosition != -1) {

                let readyValueCell = valueCell.substring(modificationSeparatorPosition + 2);
                let readyValueCellOrigin = valueCell.substring(0, modificationSeparatorPosition);

                dataRow[columnKey] = readyValueCell;
                dataRowOrigin[columnKey] = readyValueCellOrigin;

              } else if (isDataPointsFile) {
                dataRow[columnKey] = valueCell;
                if(fileDiffData.header.create.indexOf(columnKey) == -1) {
                  dataRowOrigin[columnKey] = valueCell;
                }
              }
            });

            // fix first column changes

            let conceptValueSearchFor = value[0];
            let conceptValueTypeIndex = conceptValueSearchFor.indexOf('->');

            if(conceptValueTypeIndex != -1) {
              conceptValueSearchFor = value[0].substring(0, conceptValueTypeIndex)
            }

            let dataRowUpdated = {};
            dataRowUpdated["gid"] = diffResultGidField;
            dataRowUpdated[diffResultGidField] = conceptValueSearchFor;
            dataRowUpdated["data-update"] = dataRow;

            if(isDataPointsFile) {
              dataRowUpdated["data-origin"] = dataRowOrigin;
            }

            fileDiffData.body.change.push(dataRowUpdated);
          }
        }

      });

    }



    // Structure :: Create

    dataRequest[fileName] = fileDiffData;

    cliProgress.state("processing CSV-diff, generate output");
    fs.writeFileSync("./requests/" + fileName + ".json", JSON.stringify(fileDiffData));

  });

  let result = {
    'files': gitDiffFileStatus,
    'changes': dataRequest
  };


  let resultFileName = "./requests/operation-result.json";
  fs.writeFileSync(resultFileName, JSON.stringify(result));
  let resultFilePath = fs.realpathSync(resultFileName);


  /*

    Request to WS :: Incremental update

    GET: /api/ddf/incremental-update/repo

      PARAM: path,        [/full/path/to/output_file.json]
      PARAM: githubUrl,   [git@github.com:valor-software/ddf--gapminder_world-stub-1.git]

   */

  // TODO:: Update with Real path to WS
  let CHANGE_ROUTE_WS_UPDATE = 'http://localhost:3000/api/ddf/demo/update-incremental';

  request.api.post(
    CHANGE_ROUTE_WS_UPDATE,
    {form: {
      'diff': JSON.stringify(result),
      'github': sourceUrl,
      'commit': hashTo
    }},
    function (error, response, body) {
      cliProgress.stop();
      done(null, true);
    }
  );

};

// Define Hook

step.prototype.prepare = function () {

  let prevStepResult = holder.getResult('flow-update-dataset-choose', []);
  //let filteredArray = prevStepResult.slice();
  let filteredArray = JSON.parse(JSON.stringify(prevStepResult));

  let answerHashFrom = holder.get('flow-import-dataset-update-hash-from', false);

  let answerHashFromIndex = false;

  filteredArray.forEach(function(item, index) {
    if(item.value == answerHashFrom) {
      answerHashFromIndex = index;
    }
  });

  filteredArray.forEach(function(value, index, source){
    if(answerHashFromIndex === index) {
      source[index]['disabled'] = "from";
    }
    if(answerHashFromIndex < index) {
      source[index]['disabled'] = "unavailable";
    }
  });

  this.step.choices = filteredArray;
};

// Export Module

module.exports = new step(question);