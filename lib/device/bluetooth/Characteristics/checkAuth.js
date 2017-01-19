var util = require('util');
var Characteristic = require('../blockCharacteristic');

var CheckAuthCharacteristic = function () {
  CheckAuthCharacteristic.super_.call(this, {
    uuid: '2A16',
    properties: ['read']
  });
};

util.inherits(CheckAuthCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

CheckAuthCharacteristic.prototype.getData = function (callback) {
  callback(Matrix.device.bluetooth.auth.toString());
};

module.exports = new CheckAuthCharacteristic();