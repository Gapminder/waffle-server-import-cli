'use strict';

const _ = require('lodash');
const inquirer = require('inquirer');
const inquirerUi = new inquirer.ui.BottomBar();

const moment = require('moment');
require('moment-duration-format');

const SEPARATOR_LINE = "-------------------------------------------------------------------------";
const SEPARATOR_UI = "\n\n\n\n\n\n\n\n\n\n";

const CONST_FONT_RED = "\x1b[31m";
const CONST_FONT_YELLOW = "\x1b[93m";
const CONST_FONT_DARK_YELLOW = "\x1b[33m";
const CONST_FONT_GREEN = "\x1b[32m";
const CONST_FONT_BLUE = "\x1b[34m";
const CONST_FONT_WHITE = "\x1b[0m";
const CONST_FONT_ERROR = `${CONST_FONT_RED}* ERROR:${CONST_FONT_YELLOW} `;
const CONST_FONT_WARN = `${CONST_FONT_DARK_YELLOW}* WARNING:${CONST_FONT_YELLOW} `;

function uiProgress () {

  this.textState;
  this.textLine;
  this.intervalId;

  this.textBase = '* State: ';
  this.textIncrement = '.';
  this.intervalTimeout = 500;
  this.maxTextLine = 20;
  this.timeStart = false;

  this.reset();
};

uiProgress.prototype.CONST_FONT_RED = CONST_FONT_RED;
uiProgress.prototype.CONST_FONT_YELLOW = CONST_FONT_YELLOW;
uiProgress.prototype.CONST_FONT_GREEN = CONST_FONT_GREEN;
uiProgress.prototype.CONST_FONT_BLUE = CONST_FONT_BLUE;
uiProgress.prototype.CONST_FONT_WHITE = CONST_FONT_WHITE;
uiProgress.prototype.CONST_FONT_ERROR = CONST_FONT_ERROR;
uiProgress.prototype.CONST_FONT_WARN = CONST_FONT_WARN;
uiProgress.prototype.CONST_SEPARATOR_LINE = SEPARATOR_LINE;
uiProgress.prototype.CONST_SEPARATOR_UI = SEPARATOR_UI;

uiProgress.prototype.reset = function () {
  this.stop();
  this.textState = '';
  this.textLine = ' ';
  return this;
};

uiProgress.prototype.resetTime = function (resetTiming = true) {
  if(resetTiming || !this.timeStart) {
    this.timeStart = new Date().getTime();
  }
};

uiProgress.prototype.state = function (state = '', keepTiming = true) {

  let self = this;

  self.reset();
  self.resetTime(!keepTiming);
  self.textState = state;

  self.intervalId = setInterval(function(){

    const timeNow = new Date().getTime();
    const timeDiff = parseInt((timeNow - self.timeStart)/1000, 10);
    const timeWait = " (" + moment.duration(timeDiff, 'seconds').format("y[Y] M[M] d[D] hh:mm:ss[s]") + ") ";

    self.textLine += self.textIncrement;

    if(self.textLine.length > self.maxTextLine) {
      self.textLine = ' ' + self.textIncrement;
    }

    inquirerUi.updateBottomBar(self.textBase + self.textState + timeWait + self.textLine);

  }, self.intervalTimeout);

  return this;
};

uiProgress.prototype.stop = function () {
  inquirerUi.updateBottomBar("");
  clearInterval(this.intervalId);
  this.timeStart = false;
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
  printMessage(CONST_FONT_ERROR, Array.from(arguments));
  return this;
};

uiProgress.prototype.success = function () {
  printMessage(CONST_FONT_GREEN, Array.from(arguments));
  return this;
};

uiProgress.prototype.warning = function () {
  printMessage(CONST_FONT_WARN, Array.from(arguments));
  return this;
};

function printMessage(color, args) {
  console.log(`${color} ${_.isEmpty(args)? '(no message)' : args} ${CONST_FONT_WHITE}`);
}

module.exports = new uiProgress();