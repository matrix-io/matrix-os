var util = require('util');
var Characteristic = require('../blockCharacteristic');

var ReadDetailsCharacteristic = function () {
 ReadDetailsCharacteristic.super_.call(this, {
    uuid: '2A16',
    properties: ['read']
  });
};

util.inherits(ReadDetailsCharacteristic , Matrix.device.bluetooth.BlockCharacteristic);

ReadDetailsCharacteristic.prototype.getData = function (callback) {
  //TODO Need to actually return something interesting
  if (!Matrix.device.bluetooth.auth) {
    callback(Characteristic.RESULT_UNLIKELY_ERROR);
  } else {
    var status = Matrix.device.wifi.status();
    if (!_.has(status, 'wpa_state') || status.wpa_state !== 'COMPLETED') {
      status = {};
    }
    
    status = Matrix.service.cypher.encrypt(JSON.stringify(status), '');
    callback(status);
  }
};

module.exports = new  ReadDetailsCharacteristic();