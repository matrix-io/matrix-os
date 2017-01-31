var util = require('util');
var Characteristic = require('../blockCharacteristic');

var ReadConfigCharacteristic = function () {
 ReadConfigCharacteristic.super_.call(this, {
    uuid: '2A19',
    properties: ['read']
  });
};

util.inherits(ReadConfigCharacteristic , Matrix.device.bluetooth.BlockCharacteristic);

ReadConfigCharacteristic.prototype.getData = function (callback) {
  //TODO Need to actually return something interesting
  if (!Matrix.device.bluetooth.auth) {
    callback(Characteristic.RESULT_UNLIKELY_ERROR);
  } else {
    var config = {
      wifi: {
        ssid: 'MySSID',
        ip: '192.168.0.1'
      }
    };
    callback(JSON.stringify(config));
  }
};

module.exports = new  ReadConfigCharacteristic();