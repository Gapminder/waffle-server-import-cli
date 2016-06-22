'use strict';

/*

  {
    success: Boolean [true|false]
    
    *data: Any
    *message: String (Provides simple message of Server)
    *error: String (Describes Server Error. Available and Mandatory if success=false)
  }

  *, optional

*/

let wsResponse = function (response) {
  this.response = response && response.body ? response.body : {success: false};
};


wsResponse.prototype.getError = function () {
  if(this.isSuccess()) {
    return false;
  }
  return this.response.error;
};

wsResponse.prototype.isSuccess = function () {
  return !!this.response.success;
};

wsResponse.prototype.getData = function (defaultValue) {
  if(!this.isSuccess()) {
    return '';
  }

  return this.response.data || defaultValue;
};

module.exports = wsResponse;
