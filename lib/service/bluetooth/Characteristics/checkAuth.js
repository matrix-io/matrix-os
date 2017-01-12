var util = require('util');
var Characteristic = require('../blockCharacteristic');

var CheckAuthCharacteristic = function () {
  CheckAuthCharacteristic.super_.call(this, {
    uuid: '2A16',
    properties: ['read']
  });
};

util.inherits(CheckAuthCharacteristic, Matrix.service.bluetooth.BlockCharacteristic);

CheckAuthCharacteristic.prototype.getData = function (callback) {
  callback(Matrix.service.bluetooth.auth.toString());
};

module.exports = new CheckAuthCharacteristic();