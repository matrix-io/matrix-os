
var util = require('util');
var Characteristic = require('../blockCharacteristic');


var userToken = "";
var uuid = '2A17';

var SendIdAndSecretCharacteristic = function () {
  SendIdAndSecretCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write']
  });
};

util.inherits(SendIdAndSecretCharacteristic, Matrix.service.bluetooth.BlockCharacteristic);

SendIdAndSecretCharacteristic.prototype.setUserToken = function (token){ 
  userToken = token;
};

/*
@method compareDeviceToken
@param {Function} callback
@description Receive a device token  and compares it with the current device token
*/
function authenticateDevice(options) {
  console.log('BLE characteristic received a string: ', options);

  try {
    console.log('Parsing string received');
    options = JSON.parse(options);
  } catch (error) {
    return console.log('Failed to parse :(');
  }

  if (!_.has(options, 'id') || !_.has(options, 'secret')) {
    return console.log('Options missing  :(');
  }
  
  console.log('Success!');
  Matrix.service.bluetooth.emitter.emit('deviceAuth', options);
  return;
}

var sendIdAndSecretCharacteristic = new SendIdAndSecretCharacteristic();
sendIdAndSecretCharacteristic.on("newData", authenticateDevice.bind(sendIdAndSecretCharacteristic));
module.exports = sendIdAndSecretCharacteristic;