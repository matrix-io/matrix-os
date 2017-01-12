
var util = require('util');
var Characteristic = require('../blockCharacteristic');


var userToken = "";
var uuid = '2A17';

var CheckIdAndSecretCharacteristic = function () {
  CheckIdAndSecretCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write']
  });
};

util.inherits(CheckIdAndSecretCharacteristic, Matrix.service.bluetooth.BlockCharacteristic);

CheckIdAndSecretCharacteristic.prototype.setUserToken = function (token){ 
  userToken = token;
};

/*
@method compareDeviceToken
@param {Function} callback
@description Receive a device token  and compares it with the current device token
*/
function compareIdAndSecret(options) {
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

  var auth = options.id === Matrix.deviceId && options.secret === Matrix.deviceSecret;
  Matrix.service.bluetooth.auth = auth;
  Matrix.service.bluetooth.emitter.emit('configurationAuth', auth);
  
  return;
}

var checkIdAndSecretCharacteristic = new CheckIdAndSecretCharacteristic();
checkIdAndSecretCharacteristic.on("newData", compareIdAndSecret.bind(checkIdAndSecretCharacteristic));
module.exports = checkIdAndSecretCharacteristic;