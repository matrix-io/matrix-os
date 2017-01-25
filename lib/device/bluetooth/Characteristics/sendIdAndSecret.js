
var util = require('util');
var Characteristic = require('../blockCharacteristic');


var userToken = "";
var uuid = '2A21';

var SendIdAndSecretCharacteristic = function () {
  SendIdAndSecretCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write']
  });
};

util.inherits(SendIdAndSecretCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

SendIdAndSecretCharacteristic.prototype.setUserToken = function (token){ 
  userToken = token;
};

/*
@method compareDeviceToken
@param {Function} callback
@description Receive a device token  and compares it with the current device token
*/
function authenticateDevice(options) {
  
  var err;
  try {
    options = JSON.parse(options);
  } catch (error) {
    err = new Error('Unable to parse content ' + options);
  }

  if (!err && (!_.has(options, 'id') || !_.has(options, 'secret'))) {
    err = new Error('Parameter missing ' + options);
  }
  
  return Matrix.device.bluetooth.emitter.emit('deviceAuth', err, options);
}

var sendIdAndSecretCharacteristic = new SendIdAndSecretCharacteristic();
sendIdAndSecretCharacteristic.on("newData", authenticateDevice.bind(sendIdAndSecretCharacteristic));
module.exports = sendIdAndSecretCharacteristic;