'use strict';

let inquirer = require('inquirer');
let inquirerUi = new inquirer.ui.BottomBar();

const moment = require('moment');
require('moment-duration-format');

const SEPARATOR_LINE = "-------------------------------------------------------------------------";
const SEPARATOR_UI = "\n\n\n\n\n\n\n\n\n\n";

const CONST_FONT_RED = "\x1b[31m";
const CONST_FONT_YELLOW = "\x1b[33m";
const CONST_FONT_GREEN = "\x1b[32m";
const CONST_FONT_BLUE = "\x1b[34m";
const CONST_FONT_WHITE = "\x1b[0m";
const CONST_FONT_ERROR = `${CONST_FONT_RED}* ERROR:\x1b[93m `;
const CONST_FONT_WARN = `${CONST_FONT_YELLOW}* WARNING:\x1b[93m `;

function uiProgress () {

  this.textState;
  this.textLine;
  this.intervalId;

  this.textBase = '* State: ';
  this.textIncrement = '.';
  this.intervalTimeout = 500;
  this.timeStart = false;

  this.reset();
};

uiProgress.prototype.CONST_FONT_RED = CONST_FONT_RED;
uiProgress.prototype.CONST_FONT_YELLOW = CONST_FONT_YELLOW;
uiProgress.prototype.CONST_FONT_GREEN = CONST_FONT_GREEN;
uiProgress.prototype.CONST_FONT_BLUE = CONST_FONT_BLUE;
uiProgress.prototype.CONST_FONT_WHITE = CONST_FONT_WHITE;

uiProgress.prototype.reset = function () {
  this.stop();
  this.textState = '';
  this.textLine = ' ';
  return this;
};

uiProgress.prototype.resetTime = function (keepTiming) {
  if(!keepTiming || !this.timeStart) {
    this.timeStart = new Date().getTime();
  }
};

uiProgress.prototype.state = function (state, keepTiming) {

  let self = this;

  self.reset();
  self.resetTime(keepTiming);
  self.textState = state || '';

  self.intervalId = setInterval(function(){

    let timeNow = new Date().getTime();
    let timeDiff = parseInt((timeNow - self.timeStart)/1000, 10);
    let timeWait = " (" + moment.duration(timeDiff, 'seconds').format("y[Y] M[M] d[D] hh:mm:ss[s]") + ") ";

    self.textLine += self.textIncrement;
    if(self.textLine.length > 20) {
      self.textLine = self.textIncrement;
    }
    inquirerUi.updateBottomBar(self.textBase + self.textState + timeWait + self.textLine);

  }, self.intervalTimeout);

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
uiProgress.prototype.warning = function () {
  let args = Array.prototype.slice.call(arguments);
  args[0] = CONST_FONT_WARN + args[0];
  args.push(CONST_FONT_WHITE);
  console.log.apply(console, args);
  return this;
};

module.exports = new uiProgress();