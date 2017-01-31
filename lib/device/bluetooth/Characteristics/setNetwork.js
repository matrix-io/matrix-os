
var util = require('util');
var Characteristic = require('../blockCharacteristic');


var userToken = "";
var uuid = '2A22';

var SetNetworkCharacteristic = function () {
  SetNetworkCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write']
  });
};

util.inherits(SetNetworkCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

SetNetworkCharacteristic.prototype.setUserToken = function (token) {
  userToken = token;
};

function setNetwork(options) {
  var err;
  if (Matrix.device.bluetooth.auth) {
    try {
      debug('Parsing string received');
      options = JSON.parse(options);
    } catch (error) {
      return debug('Failed to parse :(');
    }

    if (!_.has(options, 'ssid')) {
      err = new Error('Missing parameters');
      Matrix.device.bluetooth.emitter.emit('setNetwork', err, uuid);
    } else {
      if (!_.has(options.password)) {
        Matrix.device.wifi.connectOpen(options.ssid, function (err) {
          if (!err) {
            debug('Open network connection successful');
          } else {
            debug('Open network connection failed');
          }
          Matrix.device.bluetooth.emitter.emit('setNetwork', err, uuid);
        });  
      } else {
        Matrix.device.wifi.connect(options.ssid, options.password, function (err) {
          if (!err) {
            debug('Network connection successful');
          } else {
            debug('Network connection failed');
          }
          Matrix.device.bluetooth.emitter.emit('setNetwork', err, uuid);
        });
      }
      
    }
  } else {
    err = new Error('Client hasn\'t authenticated');
    Matrix.device.bluetooth.emitter.emit('actionFinished', err, uuid);
  }
  
}

var setNetworkCharacteristic = new SetNetworkCharacteristic();
setNetworkCharacteristic.on("newData", setNetwork.bind(setNetworkCharacteristic));
module.exports = setNetworkCharacteristic;