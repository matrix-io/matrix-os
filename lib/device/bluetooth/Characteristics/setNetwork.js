
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

  try {
    console.log('Parsing string received');
    options = JSON.parse(options);
  } catch (error) {
    return console.log('Failed to parse :(');
  }

  if (!_.has(options, 'ssid')) {
    /*!_.has(options, 'password')){

    }*/
    err = new Error('Missing parameters');
    Matrix.device.bluetooth.emitter.emit('setNetwork', err);
  } else {
    if (!_.has(options.password)) {
      Matrix.device.wifi.connectOpen(options.ssid, function (err) {
        if (!err) {
          console.log('Open network connection successful');
        } else {
          console.log('Open network connection failed');
        }
        Matrix.device.bluetooth.emitter.emit('setNetwork', err);
      });  
    } else {
      Matrix.device.wifi.connect(options.ssid, options.password, function (err) {
        if (!err) {
          console.log('Network connection successful');
        } else {
          console.log('Network connection failed');
        }
        Matrix.device.bluetooth.emitter.emit('setNetwork', err);
      });
    }
    
  }
  
}

var setNetworkCharacteristic = new SetNetworkCharacteristic();
setNetworkCharacteristic.on("newData", setNetwork.bind(setNetworkCharacteristic));
module.exports = setNetworkCharacteristic;