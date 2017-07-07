var util = require('util');
var uuid = '2A18';

var Notify = function () {
  Notify.super_.call(this, {
    uuid: uuid,
    properties: ['notify'],
    secure: []
  });
}

util.inherits(Notify, Matrix.device.bluetooth.BlockCharacteristic);
module.exports = new Notify();