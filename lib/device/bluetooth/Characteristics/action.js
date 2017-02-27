
var util = require('util');
var Characteristic = require('../blockCharacteristic');
var debug = debugLog('bt-char-action');

var userToken = "";
var uuid = '2A23';

var ActionCharacteristic = function () {
  ActionCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write', 'notify']
  });
};

util.inherits(ActionCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

function action(options) {
  var err;
  if (_.isUndefined(options) || options == '') {
    err = new Error('Empty BLE payload sent');
  } else if (Matrix.device.bluetooth.auth) {
    try {
      debug('Parsing string received');
      options = JSON.parse(options);
    } catch (error) {
      return debug('Failed to parse :(');
    }

    if (_.has(options, 'action')) {
      if (options.action === 'reset') {
        Matrix.deviceId = undefined;
        Matrix.deviceSecret = undefined;
      } else {
        err = new Error('Unknown action [' + options.action + '] requested'); 
      }
    } else {
      err = new Error('No action requested');
    }
  } else {
    err = new Error('Client hasn\'t authenticated');
    debug('BLE configuration not authorized', uuid);
  }

  Matrix.device.bluetooth.emitter.emit('actionFinished', uuid, err);
  
}

var ActionCharacteristic = new ActionCharacteristic();
ActionCharacteristic.on("newData", action.bind(ActionCharacteristic));
module.exports = ActionCharacteristic;