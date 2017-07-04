var util = require('util');
var debug = debugLog('bt-char-network');
var uuid = '2A22';

var SetNetworkCharacteristic = function () {
  SetNetworkCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write', 'notify']
  });
};

util.inherits(SetNetworkCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

function setNetwork(options) {
  var err;
  //TODO This could use some refactoring
  if (_.isUndefined(options) || options === '') {
    err = new Error('Empty BLE payload sent');
    Matrix.device.bluetooth.emitter.emit('actionFinished', err, uuid);
  } else {
    options = Matrix.service.cypher.decrypt(options, '');
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
      debug('BLE configuration not authorized', uuid);
      err = new Error('Client hasn\'t authenticated');
      Matrix.device.bluetooth.emitter.emit('actionFinished', err, uuid);
    }
  }
  
}

var setNetworkCharacteristic = new SetNetworkCharacteristic();
setNetworkCharacteristic.on('newData', setNetwork.bind(setNetworkCharacteristic));
module.exports = setNetworkCharacteristic;