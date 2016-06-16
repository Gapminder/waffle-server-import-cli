'use strict';

const inquirer = require('inquirer');
const SchemeConst = require('./step-const');

let step = function (data) {

  this.nextDirect = false;
  this.nextStrategy = false;
  this.backDirect = false;
  this.runner = false;

  this.hash = data.name;
  this.step = data;
  this.value = false;

  this.step.validate = data.process || this.process;
  this.step.filter = data.filter || this.filter;

  return this;
};


step.prototype.getName = function () {
  return this.hash;
};
step.prototype.process = function () {
  console.log("DEBUG::base, process");
  return true;
};
step.prototype.filter = function (inputValue) {
  return inputValue;
};

step.prototype.setQuestionChoices = function (list, nextStrategy) {
  this.step.choices = list;
  this.runner.setNextDynamic(this.getName(), nextStrategy);
};

// Group of Flow manipulation Functions

step.prototype.setNext = function (step) {
  this.nextDirect = step;
  this.nextStrategy = false;
};
step.prototype.setNextStrategy = function (steps) {
  this.nextDirect = false;
  this.nextStrategy = steps;
};
step.prototype.setBack = function (step) {
  this.backDirect = step;
};

// check selected value for type list
step.prototype.availableChoice = function (value) {

  if(
    value == SchemeConst.STEP_KEY_BACK ||
    value == SchemeConst.STEP_KEY_EXIT
  ) {
    return false;
  }
  return true;
};


// Hook before Run Main Step implementation

step.prototype.preProcess = function (callback) {
  callback();
};

// Main Flow Runner

step.prototype.run = function (holder, runner) {

  this.runner = runner;
  this.holder = holder;

  this.preProcess(function (error) {

    if(error) {
      console.log("Exit:", error);
      return true;
    }

    inquirer.prompt(this.step).then(function (answers) {

      // get current step value
      this.value = answers[this.hash];

      // save answer to holder
      holder.set(this.hash, this.value);

      // Flow :: Back
      if (this.backDirect && this.value == "Back") {
        return this.backDirect.run(holder, runner);
      }
      // Flow :: Direct Next Step
      else if (this.nextDirect) {
        return this.nextDirect.run(holder, runner);
      }
      // Flow :: Next Step Strategy
      else if (this.nextStrategy && this.nextStrategy[this.value]) {
        return this.nextStrategy[this.value].run(holder, runner);
      }
      // Flow :: Exit
      else {
        return true;
      }

    }.bind(this));

  }.bind(this));

};

module.exports = step;
