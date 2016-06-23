'use strict';

let inquirer = require('inquirer');
let inquirerUi = new inquirer.ui.BottomBar();

const SEPARATOR_LINE = "-------------------------------------------------------------------------";
const SEPARATOR_UI = "\n\n\n\n\n\n\n\n";

const CONST_FONT_ERROR = "\x1b[31m* ERROR:\x1b[93m ";
const CONST_FONT_GREEN = "\x1b[32m";
const CONST_FONT_WHITE = "\x1b[0m";

function uiProgress () {

  this.textState;
  this.textLine;
  this.intervalId;

  this.textBase = '* State: ';
  this.textIncrement = '.';
  this.intervalTimeout = 500;

  this.reset();
};

uiProgress.prototype.reset = function () {
  this.stop();
  this.textState = '';
  this.textLine = ' ';
  return this;
};

uiProgress.prototype.state = function (state) {

  let that = this;

  that.reset();
  that.textState = state || '';

  let timeStart = new Date().getTime();

  that.intervalId = setInterval(function(){

    let timeNow = new Date().getTime();
    let timeDiff = parseInt((timeNow - timeStart)/1000, 10);
    let timeWait = " (" + timeDiff + "s) ";

    that.textLine += that.textIncrement;
    if(that.textLine.length > 20) {
      that.textLine = that.textIncrement;
    }
    inquirerUi.updateBottomBar(that.textBase + that.textState + timeWait + that.textLine);

  }, that.intervalTimeout);

  return this;
};

uiProgress.prototype.stop = function () {
  inquirerUi.updateBottomBar("");
  clearInterval(this.intervalId);
  return this;
};

// implement :: console.log - could be changed to better lib

uiProgress.prototype.logStart = function () {
  console.log("\n" + SEPARATOR_LINE);
  return this;
};
uiProgress.prototype.logEnd = function () {
  console.log(SEPARATOR_LINE + SEPARATOR_UI);
  return this;
};

uiProgress.prototype.logPrint = function (data) {
  this.logStart();
  data.forEach(function(item){
    console.log(item);
  });
  this.logEnd();
  return this;
};

uiProgress.prototype.error = function () {
  let args = Array.prototype.slice.call(arguments);
  args[0] = CONST_FONT_ERROR + args[0];
  args.push(CONST_FONT_WHITE);
  console.log.apply(console, args);
  return this;
};
uiProgress.prototype.success = function () {
  let args = Array.prototype.slice.call(arguments);
  args[0] = CONST_FONT_GREEN + args[0];
  args.push(CONST_FONT_WHITE);
  console.log.apply(console, args);
  return this;
};

module.exports = new uiProgress();