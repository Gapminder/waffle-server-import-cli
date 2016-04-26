'use strict';

var inquirer = require('inquirer');

var step = function (data) {

  this.value = false;

  this.nextDirect = false;
  this.nextStrategy = false;

  this.hash = data.name;
  this.step = data;

  this.step.validate = data.process || this.process;
  this.step.filter = data.filter || this.filter;

  return this;
};

step.prototype.process = function (inputValue) {
  return true;
};
step.prototype.filter = function (inputValue) {
  return inputValue;
};


step.prototype.setNext = function (step) {
  this.nextDirect = step;
  this.nextStrategy = false;
};
step.prototype.setNextStrategy = function (steps) {
  this.nextDirect = false;
  this.nextStrategy = steps;
};

// Hook to Enlarge Step Flow
step.prototype.prepare = function () {

};

step.prototype.run = function (holder) {

  inquirer.prompt(this.step).then(function (answers) {

    this.value = answers[this.hash];
    holder.set(this.hash, this.value);

    if (this.nextDirect) {
      this.nextDirect.prepare();
      return this.nextDirect.run(holder);
    }
    if (this.nextStrategy && this.nextStrategy[this.value]) {
      this.nextStrategy[this.value].prepare();
      return this.nextStrategy[this.value].run(holder);
    }

    //console.log(holder.getAll());
    //console.log(holder.getAllResults());
    return true;

  }.bind(this));
};

module.exports = step;
