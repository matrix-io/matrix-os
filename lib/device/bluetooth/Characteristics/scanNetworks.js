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
  if (Matrix.device.bluetooth.auth) {
    Matrix.device.wifi.scan(function (err, scanResults) { 
      console.log('Scan requested: ', _.map(scanResults, 'ssid'));
      scanResults = Matrix.service.cypher.encrypt(JSON.stringify(scanResults), '');
      return callback(scanResults);
    }); 
  } else {
    return callback(Characteristic.RESULT_UNLIKELY_ERROR);
  }
};

module.exports = new ScanNetworksCharacteristic();