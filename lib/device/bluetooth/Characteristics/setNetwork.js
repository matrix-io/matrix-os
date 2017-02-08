
var util = require('util');
var Characteristic = require('../blockCharacteristic');


var userToken = "";
var uuid = '2A22';

var SetNetworkCharacteristic = function () {
  SetNetworkCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write', 'notify']
  });
};

util.inherits(SetNetworkCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

SetNetworkCharacteristic.prototype.setUserToken = function (token) {
  userToken = token;
};

function setNetwork(options) {
  console.log('Setting encrypted network:', options);
  options = Matrix.service.cypher.decrypt(options, '');
  console.log('Setting network:', options);
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
      console.log('Connecting device to Wifi network', options.ssid, '...');
      if (!_.has(options, 'password')) {
        console.log('No password found in:', options);
        Matrix.device.wifi.connectOpen(options.ssid, function (err, result) {
          if (!err) {
            if (!result){ 
              err = new Error('Unable to connect to the network', options.ssid);
              console.log('Network connection failed');
            } else {
              console.log('Network connection successful!');
            }
          } else {
            console.log('Error connection to network');
          }
          Matrix.device.bluetooth.emitter.emit('setNetwork', err, uuid);
        });  
      } else {
        console.log('Password found in:', options);
        Matrix.device.wifi.connect(options.ssid, options.password, function (err, result) {
          if (!err) {
            if (!result){ 
              err = new Error('Unable to connect to the network', options.ssid);
              console.log('Network connection failed');
            } else {
              console.log('Network connection successful!');
            }
          } else {
            console.log('Error connection to network');
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