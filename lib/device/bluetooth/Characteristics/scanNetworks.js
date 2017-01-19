var util = require('util');
var Characteristic = require('../blockCharacteristic');

var ScanNetworksCharacteristic = function () {
  ScanNetworksCharacteristic.super_.call(this, {
    uuid: '2A23',
    properties: ['read']
  });
};

util.inherits(ScanNetworksCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

ScanNetworksCharacteristic.prototype.getData = function (callback) {
  Matrix.device.wifi.scan(function (scanResults) { 
    callback(JSON.stringify(scanResults));
  });
};

module.exports = new ScanNetworksCharacteristic();