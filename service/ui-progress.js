'use strict';

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
    inquirerUi.updateBottomBar(that.textBase + that.textState + that.textLine);

  }, that.intervalTimeout);

};

uiProgress.prototype.stop = function () {
  clearInterval(this.intervalId);
};

module.exports = new uiProgress();