'use strict';

let inquirer = require('inquirer');
let inquirerUi = new inquirer.ui.BottomBar();





function uiProgress () {

  this.textBase = 'Loading ';
  this.textIncrement = '.';
  this.textLine = '';
  this.intervalTimeout = 500;

  this.intervalId;

};

uiProgress.prototype.start = function () {

  let that = this;

  that.textLine = '';
  that.intervalId = setInterval(function(){

    that.textLine += that.textIncrement;
    inquirerUi.updateBottomBar(that.textBase + that.textLine);

  }, that.intervalTimeout);

};

uiProgress.prototype.stop = function () {
  clearInterval(this.intervalId);
};

module.exports = new uiProgress();