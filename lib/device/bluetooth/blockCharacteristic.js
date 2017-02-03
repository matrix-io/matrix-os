var bleno = require('bleno');
var util = require('util')
var packageIndex = 0;
var packageArray = [];
var hourZoneData = "";
var partialData = "";
var dataSize = 0;
var blockSize = 512;
var headerDelimiter = "&";
var async = require("async");

var Characteristic = function (options) {
  Characteristic.super_.call(this, options);
  if (options.getData) {
    this.getData = options.getData;
  }
};

util.inherits(Characteristic, bleno.Characteristic);

Characteristic.prototype.onReadRequest = function (offset, callback) {
  debug('READ data: ', offset);
  var self = this;

  //If this is the first time, generate the message
  if (packageArray.length == 0) {
    self.generateMessage(function () {
      self.generate(offset, callback);
    });
  } else {
    if (offset == 0) {
      packageIndex++;
    }
    self.generate(offset, callback);
  }
};


Characteristic.prototype.generate = function (offset, callback) {
  if (_needsReset()) {
    this.generateMessage(function () {
      returnResponse(offset, callback);
    });
  } else {
    returnResponse(offset, callback);
  }
}


function returnResponse(offset, callback) {
  if (offset > packageArray[packageIndex].length) {
    _reset();
    return callback(bleno.Characteristic.RESULT_INVALID_OFFSET);
  }
  return callback(bleno.Characteristic.RESULT_SUCCESS, new Buffer(packageArray[packageIndex].slice(offset)));
}


Characteristic.prototype.onWriteRequest = function (data, offset, withoutResponse, callback) {
  debug('WRITE data: ', data, offset);
  debug('partialData:', partialData);
  var info = data.toString();
  if (info.indexOf(headerDelimiter) > -1 && offset == 0) {
    partialData = info.substring(info.lastIndexOf(headerDelimiter) + 1);
    dataSize = parseInt(info.substring(info.indexOf(headerDelimiter) + 1, info.lastIndexOf(headerDelimiter)), 10)
  } else {
    partialData += info;
  }
  if (dataSize == partialData.length) {
    hourZoneData = partialData;
    partialData = "";
    dataSize = 0;
    this.emit("newData", hourZoneData);
  } else if (dataSize < partialData.length) {
    partialData = "";
    dataSize = 0;
    this.emit("error, message size was bigger that the size sent " + partialData);
    return callback(bleno.Characteristic.RESULT_UNLIKELY_ERROR);
  }
  return callback(bleno.Characteristic.RESULT_SUCCESS);
};


Characteristic.prototype.onSubscribe = function (maxValueSize, updateValueCallback) {
  console.log("Subscribed!");
  this.on("updateResponse", function (response) {
    console.log("UPDATE RESPONSE!", response);
    _sendNotificationBlocks(response, updateValueCallback);
  });
}


function _sendNotificationBlocks(response, updateCallback) {
  var responseBlocks = _generateBlocks(response, 20);
  async.eachSeries(responseBlocks, function iterator(block, nextBlock) {
    updateCallback(new Buffer(block));
    nextBlock();
  });
}


Characteristic.prototype.generateMessage = function (callback) {

  if (this.getData) {
    this.getData(function (data) {
      packageArray = _generateBlocks(data);
      packageIndex = 0;
      callback();
    });
  } else {
    this.emit("error , this characteristic is not a write one " + partialData);
    callback(new Error("No getData function"));
  }

}

Characteristic.prototype.clearMessage = function () {
  return _reset();  
}

Characteristic.prototype.clear = function () { 
  _reset();
  this.removeAllListeners('updateResponse');
  return;
}

function _reset() {
  packageIndex = 0;
  packageArray = [];
}


function _needsReset() {
  return packageIndex >= packageArray.length && packageArray.length != 0;
}


function _generateBlocks(message, blockLimit) {
  if (_.isUndefined(blockLimit)) blockLimit = blockSize;
  if (!message || !message.hasOwnProperty('length')) {
    return [];  
  } else {
    var header = headerDelimiter + message.length + headerDelimiter;
    return _chunkStringToArray(header + message, blockLimit);
  }
}

function _chunkStringToArray(str, length) {
  return str.match(new RegExp('.{1,' + length + '}', 'g'));
}

module.exports = Characteristic;