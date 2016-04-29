'use strict';

var async = require("async");
var _ = require('lodash');
var path = require("path");
var holder = require('./../model/value-holder');
var Converter = require('csvtojson').Converter;

/******************************************** DEFINITION **************************************************************/

function DdfImporter () {

  this.files = [];
  this.path = null;

  this.data = {
    'raw': {},
    'concepts': {},
    'entities': {}
  };
}

/******************************************** FUNCTIONS :: MAIN FLOW **************************************************/

DdfImporter.prototype.process = function (path, files, callback) {

  this.files = files;
  this.path = path;

  console.log("\n");

  // async flow

  async.waterfall([

    async.constant(this.data),

    this.createConcepts.bind(this),
    this.createEntities.bind(this),
    this.createDataPoints.bind(this)

  ], (err, res) => {
    return callback(err, res);
  });
};

DdfImporter.prototype.createConcepts = function (pipe, callback) {

  console.log("+ DdfImporter, createConcepts");

  async.waterfall([

    async.constant(this.data),

    this._loadConcepts.bind(this),
    this._createConcepts.bind(this),
    this._getAllConcepts.bind(this),
    this._addConceptDrillups.bind(this),
    this._addConceptDrilldowns.bind(this),
    this._addConceptDomains.bind(this),
    this._getAllConcepts.bind(this)

  ], (err, res) => {
    pipe.concepts = res.concepts;
    return callback(err, pipe);
  });

};

DdfImporter.prototype.createEntities = function (pipe, callback) {

  console.log("+ DdfImporter, createEntities");

  async.waterfall([

    async.constant(this.data),

    this._processOriginalEntities.bind(this),
    this._findAllOriginalEntities.bind(this),
    this._createEntitiesBasedOnOriginalEntities.bind(this),
    this._clearOriginalEntities.bind(this),
    this._findAllEntities.bind(this),
    this._addEntityChildOf.bind(this),
    this._findAllEntities.bind(this)

  ], (err, res) => {
    pipe.entities = res.entities;
    return callback(err, pipe);
  });

};

DdfImporter.prototype.createDataPoints = function (pipe, callback) {
  console.log("+ DdfImporter, createDataPoints");
  return callback(null, pipe);
};

/******************************************** PRIVATE *****************************************************************/

DdfImporter.prototype._loadConcepts = function (pipe, callback) {

  console.log("++ _loadConcepts");

  this._readCsvFile(
    path.resolve(this.path, 'ddf--concepts.csv'),
    {},
    function(error, data){

      var concepts = _.map(data, mapDdfConceptsToWsModel(pipe));
      let uniqueConcepts = _.uniqBy(concepts, 'gid');

      if (uniqueConcepts.length !== concepts.length) {
        return callback("All concept gid's should be unique within the dataset!");
      }

      console.log(concepts);

      pipe.raw = {
        concepts: concepts,
        drillups: reduceUniqueNestedValues(concepts, 'properties.drill_up'),
        drilldowns: reduceUniqueNestedValues(concepts, 'properties.drill_down'),
        domains: reduceUniqueNestedValues(concepts, 'properties.domain')
      };

      console.log(pipe);

      return callback(error, pipe);
    }
  );
};

DdfImporter.prototype._createConcepts = function(pipe, callback) { console.log("++ _createConcepts"); return callback(null, pipe); };
DdfImporter.prototype._getAllConcepts = function(pipe, callback) { console.log("++ _getAllConcepts"); return callback(null, pipe); };
DdfImporter.prototype._addConceptDrillups = function(pipe, callback) { console.log("++ _addConceptDrillups"); return callback(null, pipe); };
DdfImporter.prototype._addConceptDrilldowns = function(pipe, callback) { console.log("++ _addConceptDrilldowns"); return callback(null, pipe); };
DdfImporter.prototype._addConceptDomains = function(pipe, callback) { console.log("++ _addConceptDomains"); return callback(null, pipe); };
DdfImporter.prototype._getAllConcepts = function(pipe, callback) { console.log("++ _getAllConcepts"); return callback(null, pipe); };

DdfImporter.prototype._processOriginalEntities = function(pipe, callback) { console.log("++ _processOriginalEntities"); return callback(null, pipe); };
DdfImporter.prototype._findAllOriginalEntities = function(pipe, callback) { console.log("++ _findAllOriginalEntities"); return callback(null, pipe); };
DdfImporter.prototype._createEntitiesBasedOnOriginalEntities = function(pipe, callback) { console.log("++ _createEntitiesBasedOnOriginalEntities"); return callback(null, pipe); };
DdfImporter.prototype._clearOriginalEntities = function(pipe, callback) { console.log("++ _clearOriginalEntities"); return callback(null, pipe); };
DdfImporter.prototype._findAllEntities = function(pipe, callback) { console.log("++ _findAllEntities"); return callback(null, pipe); };
DdfImporter.prototype._addEntityChildOf = function(pipe, callback) { console.log("++ _addEntityChildOf"); return callback(null, pipe); };
DdfImporter.prototype._findAllEntities = function(pipe, callback) { console.log("++ _findAllEntities"); return callback(null, pipe); };

DdfImporter.prototype._readCsvFile = function (file, options, callback) {

  const converter = new Converter(Object.assign({}, {
    workerNum: 1,
    flatKeys: true
  }, options));

  converter.fromFile(file, (err, data) => {
    if (err && err.toString().indexOf("cannot be found.") > -1) {
      console.warn("Warning", err);
    }
    if (err && err.toString().indexOf("cannot be found.") === -1) {
      console.error("Error", err);
    }

    return callback(null, data);
  });
};

/**/

function mapDdfConceptsToWsModel (pipe) {

  return function (entry, rowNumber) {
    let _entry = validateConcept(entry, rowNumber);

    return {
      gid: _entry.concept,

      name: _entry.name,
      type: _entry.concept_type,

      tooltip: _entry.tooltip,
      link: _entry.indicator_url,

      tags: _entry.tags,
      color: _entry.color,
      domain: null,
      unit: _entry.unit,
      scales: _entry.scales,

      drillups: [],
      drilldowns: [],

      properties: _entry,
      versions: 'test' /*[pipe.version._id]*/
    };
  };
}

function reduceUniqueNestedValues (data, propertyName) {
  return _.chain(data)
      .flatMap(item => _.get(item, propertyName))
      .uniq()
      .compact()
      .value();
}

function validateConcept(entry, rowNumber) {

  let resolvedJSONColumns = ['color', 'scales', 'drill_up', 'drill_down'];
  let _entry = _.mapValues(entry, (value, columnName) => {

    if (!value) {
      return null;
    }

    let isResolvedJSONColumn = resolvedJSONColumns.indexOf(columnName) > -1;
    let _value;

    try {
      _value = value && isResolvedJSONColumn && typeof value !== 'object' ? JSON.parse(value) : value;
    } catch (e) {
      console.error(`[${rowNumber}, ${columnName}] Validation error: The cell value isn't valid JSON, fix it please!\nError message : ${e}\nGiven value: ${value}`);
      return null;
    }

    return _value;
  });

  return _entry;
}

/******************************************** EXPORT ******************************************************************/

module.exports = new DdfImporter();