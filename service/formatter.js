'use strict';

let Formatter = function () {};


Formatter.prototype.date = function (dateRaw) {

  let date = (typeof dateRaw == 'string') ? new Date(dateRaw) : dateRaw;
  let dateFormat = [];

  dateFormat.push(date.getUTCFullYear());
  dateFormat.push("-");
  dateFormat.push(this.leadZero(date.getUTCMonth() + 1));
  dateFormat.push("-");
  dateFormat.push(this.leadZero(date.getUTCDate()));
  dateFormat.push(" ");
  dateFormat.push(this.leadZero(date.getUTCHours()));
  dateFormat.push(":");
  dateFormat.push(this.leadZero(date.getUTCMinutes()));
  dateFormat.push(":");
  dateFormat.push(this.leadZero(date.getUTCSeconds()));

  return dateFormat.join("");
};

Formatter.prototype.leadZero = function (input) {
  return ('0' + input).slice(-2);
};

module.exports = new Formatter();

