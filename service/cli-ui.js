'use strict';const fs = require('fs');

let inquirer = require('inquirer');
let inquirerUi = new inquirer.ui.BottomBar();

function uiProgress () {

  this.textState;
  this.textLine;
  this.intervalId;

  this.textBase = 'State: ';
  this.textIncrement = '.';
  this.intervalTimeout = 500;

  this.reset();
};

uiProgress.prototype.reset = function () {
  this.stop();
  this.textState = '';
  this.textLine = ' ';
};

uiProgress.prototype.state = function (state) {

  let that = this;

  that.reset();
  that.textState = state || '';

  that.intervalId = setInterval(function(){

    that.textLine += that.textIncrement;
    if(that.textLine.length > 20) {
      that.textLine = that.textIncrement;
    }
    inquirerUi.updateBottomBar(that.textBase + that.textState + that.textLine);

  }, that.intervalTimeout);

};

uiProgress.prototype.stop = function () {
  inquirerUi.updateBottomBar("");
  clearInterval(this.intervalId);
};

// implement :: console.log - could be changed to better lib

uiProgress.prototype.logStart = function () {
  console.log("\n----------------------------------------\n");
};
uiProgress.prototype.logEnd = function () {
  console.log("\n----------------------------------------\n\n\n\n\n");
};

uiProgress.prototype.logPrint = function () {
  this.logStart();
  console.log.apply(console, arguments);
  this.logEnd();
};

uiProgress.prototype.error = function () {
  let args = Array.prototype.slice.call(arguments);
  args.unshift("\x1b[31mERROR:\x1b[22m \x1b[93m");
  args.push("\x1B[37m");
  console.log.apply(console, args);
};
uiProgress.prototype.success = function () {
  let args = Array.prototype.slice.call(arguments);
  args.unshift("\x1b[32m");
  args.push("\x1B[37m");
  console.log.apply(console, args);
};


module.exports = new uiProgress();