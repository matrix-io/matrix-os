
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

function authenticateDevice(options) {

  if (!_.isUndefined(Matrix.deviceId)) {
    err = new Error('Device is already configured with id ' + Matrix.deviceId);
  } else {
    var err;
    try {
      options = JSON.parse(options);
    } catch (error) {
      err = new Error('Unable to parse content ' + options);
    }

    if (!err && (!_.has(options, 'id') || !_.has(options, 'secret') || !_.has(options, 'env'))) {
      err = new Error('Parameter missing ' + JSON.stringify(options));
    } else if (Matrix.env != options.env) {  
      err = new Error('Environment missmatch ' + options.env);
    }
  }

  return Matrix.device.bluetooth.emitter.emit('deviceAuth', err, uuid, options);
}

var sendIdAndSecretCharacteristic = new SendIdAndSecretCharacteristic();
sendIdAndSecretCharacteristic.on("newData", authenticateDevice.bind(sendIdAndSecretCharacteristic));
module.exports = sendIdAndSecretCharacteristic;