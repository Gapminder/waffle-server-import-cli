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
const async = require("async");
const request = require('request-defaults');

step.prototype.process = function (inputValue) {

  let doneStep = this.async();
  cliProgress.state("processing CSV-diff");

  /* STEP :: prepare data, find hashes */
  
  let answerHashFrom = holder.get('flow-import-dataset-update-hash-from', false);
  let answerHashTo = inputValue;

  let stepHashFrom = answerHashFrom.split(" ")[0];
  let stepHashTo = answerHashTo.split(" ")[0];

  let stepSourceFolder = holder.getResult('flow-update-selected-repo', '').folder;
  let stepSourceUrl = holder.getResult('flow-update-selected-repo', '').github;

  /* STEP :: get diff by hashes */


  let gitHashFrom = stepHashFrom;
  let gitHashTo = stepHashTo;
  let gitRepo = stepSourceUrl;

  let regexpFolder = /\/(.+)\.git/;
  let regexpFolderRes = regexpFolder.exec(gitRepo);
  let regexpFolderGitFolder = regexpFolderRes[1];
  let sourceFolderPath = './repos/';

  let hashFrom = gitHashFrom;
  let hashTo = gitHashTo;
  let sourceUrl = gitRepo;
  let sourceFolder = regexpFolderGitFolder;

  let gitFolder;
  let gitDiffFileStatus = {};
  let dataRequest = {};

  // clone repo locally

  if(!fs.existsSync("./requests/")) {
    fs.mkdirSync("./requests/");
  }

  if(!fs.existsSync("./repos/")) {
    fs.mkdirSync("./repos/");
  }

  async.waterfall(
    [
      // create folder and clone
      function(done) {

        let execCD = "cd " + sourceFolderPath + sourceFolder;
        shelljs.exec(execCD, {silent: true, async: true}, function(error, stdout, stderr) {
          //console.log(execCD, stdout);
          // folder not found
          if(!!stderr) {
            shelljs.exec("cd " + sourceFolderPath + " && git clone " + sourceUrl, {silent: true, async: true}, function(error, stdout, stderr) {
              return done(null);
            });
          } else {
            return done(null);
          }
        });
      },
      // pull changes
      function(done) {

        gitFolder = '--git-dir=' + sourceFolderPath + sourceFolder + '/.git';
        let execGitPull = "git " + gitFolder + " pull origin master";
        shelljs.exec(execGitPull, {silent: true, async: true}, function(error, stdout, stderr) {
          //console.log(execGitPull, stdout);
          return done(null);
        });
      },
      // files diff
      function(done) {

        let commandGitDiff = 'git ' + gitFolder + ' diff ' + hashFrom + '..' + hashTo + ' --name-only';
        shelljs.exec(commandGitDiff, {silent: true, async: true}, function(error, stdout, stderr) {

          if(!!stderr) {
            return done(stderr);
          }

          let resultGitDiff = stdout;
          let gitDiffFileList = resultGitDiff.split("\n").filter(function(value){
            return !!value && value.indexOf(".csv") != -1;
          });

          let commandGitDiffByFiles = 'git ' + gitFolder + ' diff ' + hashFrom + '..' + hashTo + ' --name-status';
          shelljs.exec(commandGitDiffByFiles, {silent: true, async: true}, function(error, stdout, stderr) {

            //console.log(commandGitDiffByFiles, stdout);
            let resultGitDiffByFiles = stdout;

            resultGitDiffByFiles.split("\n").filter(function(value) {
              return !!value && value.indexOf(".csv") != -1;
            }).map(function(rawFile) {
              let fileStat = rawFile.split("\t");
              gitDiffFileStatus[fileStat[1]] = fileStat[0];
            });

            done(null, gitDiffFileList);
          });
        });
      }
    ],
    // callback
    function(error, gitDiffFileList) {

      if(!!error) {
        console.log("\x1b[31mERROR:\x1b[22m \x1b[93m", error);
        return false;
      }

      async.mapLimit(
        gitDiffFileList,
        2,
        // iteration
        function(fileName, doneMapLimit){

          let commandGitShowFrom = 'git ' + gitFolder + ' show ' + hashFrom + ':' + fileName;
          let commandGitShowTo = 'git ' + gitFolder + ' show ' + hashTo + ':' + fileName;

          async.waterfall(
            [
              function(done) {

                let csvFrom = [];
                return shelljs.exec(commandGitShowFrom, {silent: true, async: true}).stdout.on("data", function(dataFrom) {
                  csvFrom.push(dataFrom);
                })
                  .on('end', function() {
                    return done(null, csvFrom.join(""));
                  });
              },
              function(dataFrom, done) {

                let csvTo = [];
                return shelljs.exec(commandGitShowTo, {silent: true, async: true}).stdout.on("data", function(dataTo) {
                  csvTo.push(dataTo);
                }).on("end", function() {
                  return done(null, {from: dataFrom, to: csvTo.join("")});
                });
              }
            ],
            // callback
            function(error, result) {

              // implement diff for file
              getDiffByFile(fileName, result);
              return doneMapLimit(error);
            }
          );
        },
        // callback
        function(error){
          completeFlow();
        }
      );
    }
  );

  function getDiffByFile (fileName, dataDiff) {

    let diffResult = [];

    //console.log("FROM-TO", dataDiff.from.length, dataDiff.to.length);

    const tableFrom = new daff.Csv().makeTable(dataDiff.from);
    const tableTo = new daff.Csv().makeTable(dataDiff.to);

    let filesDiff = daff.compareTables(tableFrom,tableTo).align();

    let flags = new daff.CompareFlags();
    flags.show_unchanged = true;
    flags.show_unchanged_columns = true;
    flags.always_show_header = true;

    let highlighter = new daff.TableDiff(filesDiff, flags);
    highlighter.hilite(diffResult);

    let fileDiffJSON = "./requests/diff--" + fileName + ".json";
    fs.writeFileSync(fileDiffJSON, JSON.stringify(diffResult));
    //console.log(fileDiffJSON);

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
              dataRowRemoved['gid'] = diffResultGidField;
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

              // cell modified
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
                // check that it's not new column
              } else if (fileDiffData.header.create.indexOf(columnKey) != -1) {
                dataRow[columnKey] = valueCell;
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
          // empty modifier symbol
        } else {
          // check that there is no new columns were added
          if(fileDiffData.header.create.length) {

            let dataRow = {};
            let dataRowOrigin = {};

            // check that file with datapoints
            value.forEach(function(valueCell, indexCell){
              let columnKey = diffResultColumns[indexCell];

              if(fileDiffData.header.create.indexOf(columnKey) == -1) {
                if(isDataPointsFile) {
                  // collect original values for datapoints
                  dataRowOrigin[columnKey] = valueCell;
                }
              } else {
                // new values for added columns
                dataRow[columnKey] = valueCell;
              }
            });

            let dataRowChanged = {};
            dataRowChanged["gid"] = diffResultGidField;
            dataRowChanged[diffResultGidField] = value[0];
            dataRowChanged["data-update"] = dataRow;

            if(isDataPointsFile) {
              dataRowChanged["data-origin"] = dataRowOrigin;
            }

            fileDiffData.body.change.push(dataRowChanged);
          }
        }

      });

    }

    // clear remove header section for removed files
    if(gitDiffFileStatus[fileName] == "D") {
      fileDiffData.header.remove = [];
    }

    // Structure :: Create

    dataRequest[fileName] = fileDiffData;
    fs.writeFileSync("./requests/" + fileName + ".json", JSON.stringify(fileDiffData));

  };

  function completeFlow () {

    let result = {
      'files': gitDiffFileStatus,
      'changes': dataRequest
    };


    let resultFileName = "./requests/diff-operation-result.json";
    fs.writeFileSync(resultFileName, JSON.stringify(result));


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
        doneStep
        done(null, true);
      }
    );


  }

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
    if(answerHashFromIndex > index) {
      source[index]['disabled'] = "unavailable";
    }
  });

  // Back Flow
  filteredArray.push(new inquirer.Separator());
  filteredArray.push('Back');

  this.step.choices = filteredArray;
};

// Export Module

module.exports = new step(question);