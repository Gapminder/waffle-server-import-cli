'use strict';

var async = require("async");
var path = require("path");
var holder = require('./../model/value-holder');
var Converter = require('csvtojson').Converter;
var defaultTimeout = 750;

/******************************************************** DEFINITION **************************************************/

var importDDFClass = function () {

  this.files = [];
  this.path = '';
  this.callback = function() {};

  return this;
};

/******************************************************** FUNCTIONS ***************************************************/

importDDFClass.prototype.process = function (path, files, callback) {

  console.log("\nImportDDF, got Files:");

  this.files = files;
  this.path = path;

  this.files.map(function(file, index){
    console.log((index + 1) + ") " + file);
  });

  // async flow

  async.waterfall([
    this.loadFileConcepts,
    this.createConcepts,
    this.addConceptDrillups,
    this.addConceptDrilldowns,
    this.addConceptDomains,
    this.createEntities,
    this.createDataPoints
  ], function (err, result) {
    callback(err, result);
  });
};

importDDFClass.prototype.loadFileConcepts = function (callback) {
  console.log("+ importDDF, loadFileConcepts");

  var filePath = path.resolve(importDdf.path, 'ddf--concepts.csv');
  console.log("filePath", filePath);

  importDdf._readCsvFile(filePath, {}, function(error, data){
    console.log("loadFileConcepts::data", data[0]);
    callback(null);
  });
};

importDDFClass.prototype.createConcepts = function (callback) {
  setTimeout(function(){
    console.log("+ importDDF, createConcepts");
    callback(null);
  }, defaultTimeout);
};

importDDFClass.prototype.addConceptDrillups = function (callback) {
  setTimeout(function(){
    console.log("+ importDDF, addConceptDrillups");
    callback(null);
  }, defaultTimeout);
};

importDDFClass.prototype.addConceptDrilldowns = function (callback) {
  setTimeout(function(){
    console.log("+ importDDF, addConceptDrilldowns");

    if(getRandResult()) {
      callback(true);
    } else {
      callback(null);
    }
  }, defaultTimeout);
};

importDDFClass.prototype.addConceptDomains = function (callback) {
  setTimeout(function(){
    console.log("+ importDDF, addConceptDomains");
    callback(null);
  }, defaultTimeout);
};

importDDFClass.prototype.createEntities = function (callback) {
  setTimeout(function(){
    console.log("+ importDDF, createEntities");
    callback(null);
  }, defaultTimeout);
};

importDDFClass.prototype.createDataPoints = function (callback) {
  setTimeout(function(){
    console.log("+ importDDF, createDataPoints");
    callback(null);
  }, defaultTimeout);
};

/******************************************************** PRIVATE *****************************************************/

importDDFClass.prototype._readCsvFile = function (file, options, callback) {

  const converter = new Converter(Object.assign({}, {
    workerNum: 1,
    flatKeys: true
  }, options));

  converter.fromFile(file, (err, data) => {
    if (err && err.toString().indexOf("cannot be found.") > -1) {
      console.log("Warning", err);
    }
    if (err && err.toString().indexOf("cannot be found.") === -1) {
      console.log("Error", err);
    }

    return callback(null, data);
  });
};

var getRandResult = function () {
  return !(Math.random()+.5|0);
};

/******************************************************** EXPORT ******************************************************/

var importDdf = new importDDFClass();
module.exports = importDdf;