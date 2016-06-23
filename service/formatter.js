'use strict';

let Formatter = function () {};


Formatter.prototype.date = function (dateRaw) {

  let date = (typeof dateRaw == 'string') ? new Date(dateRaw) : dateRaw;
  let dateFormat = [];

  dateFormat.push(date.getFullYear());
  dateFormat.push("-");
  dateFormat.push(this.leadZero(date.getMonth()));
  dateFormat.push("-");
  dateFormat.push(this.leadZero(date.getDay()));
  dateFormat.push(" ");
  dateFormat.push(this.leadZero(date.getHours()));
  dateFormat.push(":");
  dateFormat.push(this.leadZero(date.getMinutes()));
  dateFormat.push(":");
  dateFormat.push(this.leadZero(date.getSeconds()));

  return dateFormat.join("");
};

Formatter.prototype.leadZero = function (input) {
  return ('0' + input).slice(-2);
}

module.exports = new Formatter();

