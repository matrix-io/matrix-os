var util = require('util');
var Characteristic = require('../blockCharacteristic');

var DeviceIdCharacteristic = function () {
 DeviceIdCharacteristic.super_.call(this, {
    uuid: '2A20',
    properties: ['read']
  });
};

util.inherits(DeviceIdCharacteristic , Matrix.service.bluetooth.BlockCharacteristic);

 DeviceIdCharacteristic.prototype.getData = function (callback){ 
   callback('This is my message:', new Date());
};

module.exports = new  DeviceIdCharacteristic();