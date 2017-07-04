var util = require('util');
var debug = debugLog('bt-char-scan');
var uuid = '2A23';

var ScanNetworksCharacteristic = function () {
  ScanNetworksCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['read']
  });
};

util.inherits(ScanNetworksCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

ScanNetworksCharacteristic.prototype.getData = function (callback) {
  if (Matrix.device.bluetooth.auth) {
    Matrix.device.wifi.scan(function (err, scanResults) {
      if(err) {
        debug('Wifi scan error', err.message);
        return callback(Matrix.device.bluetooth.BlockCharacteristic.RESULT_UNLIKELY_ERROR);   
      } else {
        var ssids = _.map(scanResults, 'ssid');
        console.log('Scan requested: ', ssids);
        if(_.isUndefined(ssids) || _.isEmpty(ssids)) scanResults = [];
        scanResults = Matrix.service.cypher.encrypt(JSON.stringify(scanResults), '');
        return callback(scanResults);
      }
    }); 
  } else {
    debug('BLE configuration not authorized', uuid);
    return callback(Matrix.device.bluetooth.BlockCharacteristic.RESULT_UNLIKELY_ERROR);
  }
};

module.exports = new ScanNetworksCharacteristic();