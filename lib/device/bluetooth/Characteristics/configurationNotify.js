var util = require('util');
var Notify = function () {
  Notify.super_.call(this, {
    uuid: "2A18",
    properties: ['notify'],
    secure: []
  });
}

util.inherits(Notify, Matrix.device.bluetooth.BlockCharacteristic);

module.exports = new Notify();