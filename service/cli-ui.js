'use strict';

let inquirer = require('inquirer');
let inquirerUi = new inquirer.ui.BottomBar();

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
  console.log("----------------------------------------\n\n\n\n\n\n\n");
};

uiProgress.prototype.logPrint = function (data) {
  this.logStart();
  data.forEach(function(item){
    console.log(item);
  });
  this.logEnd();
};

uiProgress.prototype.error = function () {
  let args = Array.prototype.slice.call(arguments);
  args.unshift("\n\x1b[31m ERROR:\x1b[22m \x1b[93m");
  args.push("\x1B[37m");
  args.push("\n\n\n\n\n\n\n\n");
  console.log.apply(console, args);
};
uiProgress.prototype.success = function () {
  let args = Array.prototype.slice.call(arguments);
  args.unshift("\n\x1b[32m");
  args.push("\x1B[37m");
  args.push("\n\n\n\n\n\n\n\n");
  console.log.apply(console, args);
};


module.exports = new uiProgress();