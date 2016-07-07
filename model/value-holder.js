'use strict';

let holder = function () {
  return this;
};

holder.prototype.dataHolder = {};
holder.prototype.dataTransfer = {};

holder.prototype.get = function (key, defaultValue) {
  defaultValue = defaultValue || false;
  return this.dataHolder[key] || defaultValue;
};
holder.prototype.set = function (key, value) {
  this.dataHolder[key] = value;
};
holder.prototype.getAll = function () {
  return this.dataHolder;
};

// Transfer Data between Steps

holder.prototype.save = function(key, value) {
  this.dataTransfer[key] = value;
};
holder.prototype.load = function (key, defaultValue) {
  defaultValue = defaultValue || false;
  return this.dataTransfer[key] || defaultValue;
};
holder.prototype.getAllResults = function () {
  return this.dataTransfer;
};

module.exports = new holder();
