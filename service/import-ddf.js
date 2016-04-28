'use strict';

var async = require("async");

var importDDF = function () {
  this.callback = function() {

  };
  return this;
};

importDDF.prototype.process = function (files, callback) {

  console.log("\nImportDDF, got Files:");
  this.files = files;

  this.files.map(function(file, index){
    console.log((index + 1) + ") " + file);
  });

  // async flow

  async.waterfall([
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

importDDF.prototype.createConcepts = function (callback) {
  setTimeout(function(){
    console.log("importDDF, createConcepts");
    callback(null);
  }, 1000);
};

importDDF.prototype.addConceptDrillups = function (callback) {
  setTimeout(function(){
    console.log("importDDF, addConceptDrillups");
    callback(null);
  }, 1500);
};

importDDF.prototype.addConceptDrilldowns = function (callback) {
  setTimeout(function(){
    console.log("importDDF, addConceptDrilldowns");

    if(getRandResult()) {
      callback(true);
    } else {
      callback(null);
    }
  }, 500);
};

importDDF.prototype.addConceptDomains = function (callback) {
  setTimeout(function(){
    console.log("importDDF, addConceptDomains");
    callback(null);
  }, 1500);
};

importDDF.prototype.createEntities = function (callback) {
  setTimeout(function(){
    console.log("importDDF, createEntities");
    callback(null);
  }, 250);
};

importDDF.prototype.createDataPoints = function (callback) {
  setTimeout(function(){
    console.log("importDDF, createDataPoints");
    callback(null);
  }, 750);
};

module.exports = new importDDF();

/* TEMP */

var getRandResult = function () {
  return !(Math.random()+.5|0);
}
