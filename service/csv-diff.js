'use strict';

const daff = require('daff');
const fs = require('fs');
const async = require("async");

const gitFlow = require('./git-flow');
const cliUi = require('./cli-ui');

function csvDiff() {};

csvDiff.prototype.process = function (data, callback) {

  let gitHashFrom = data.hashFrom;
  let gitHashTo = data.hashTo;

  // prepare folder

  let sourceFolder = fs.realpathSync('./');
  let sourceFolderPath = sourceFolder + '/requests/';

  if(!fs.existsSync(sourceFolderPath)) {
    fs.mkdirSync(sourceFolderPath);
  }

  let dataRequest = {};
  let gitDiffFileStatus = {};

  gitFlow.getFileDiffByHashes(data, gitDiffFileStatus, function(error, gitDiffFileList) {

    if(!!error) {
      cliUi.stop().error(error);
      return callback(error);
    }

    async.mapSeries (

      gitDiffFileList,
      // iteration
      function(fileName, doneMapLimit){

        cliUi.state("generate diff for file", fileName);

        gitFlow.showFileStateByHash(data, fileName, function(error, result) {

          getDiffByFile(fileName, result);
          return doneMapLimit(error);

        });

      },
      // callback
      function(error){

        let result = {
          'files': gitDiffFileStatus,
          'changes': dataRequest
        };

        let resultFileName = sourceFolderPath + "diff-operation-result.json";
        fs.writeFileSync(resultFileName, JSON.stringify(result));

        cliUi.stop().success("* Diff generation completed!");
        return callback(false, result);
      }
    );

  });





  function getDiffByFile (fileName, dataDiff) {

    let diffResult = [];

    cliUi.state("getDiffByFile inside");

    const tableFrom = new daff.Csv().makeTable(dataDiff.from);
    const tableTo = new daff.Csv().makeTable(dataDiff.to);

    let filesDiff = daff.compareTables(tableFrom,tableTo).align();

    let flags = new daff.CompareFlags();
    flags.show_unchanged = true;
    flags.show_unchanged_columns = true;
    flags.always_show_header = true;

    let highlighter = new daff.TableDiff(filesDiff, flags);
    highlighter.hilite(diffResult);

    let fileDiffJSON = sourceFolderPath + "diff--" + fileName + ".json";
    fs.writeFileSync(fileDiffJSON, JSON.stringify(diffResult));

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
    cliUi.state("+ " + fileName + ".json");
    fs.writeFileSync(sourceFolderPath + fileName + ".json", JSON.stringify(fileDiffData));
  };

};

// Export Module

module.exports = new csvDiff();