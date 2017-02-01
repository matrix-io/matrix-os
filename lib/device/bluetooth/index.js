var util = require('util');
var bleno = require('bleno');
var events = require('events');

var BlockCharacteristic = require('./blockCharacteristic');
var connectionTimeout, notify;

const defaultAdvertistingName = 'MATRIX Creator';
const registrationTimeoutSeconds = 30;
const configurationTimeoutSeconds = 20;

const modes = {
  registration: 1,
  configuration: 2
}

function bluetooth() {
  bluetooth.super_.call(this);
}

bluetooth = bleno;
bluetooth.BlockCharacteristic = BlockCharacteristic;
bluetooth.emitter = new events.EventEmitter();
bluetooth.auth = false; //Used for configuration auth
bluetooth.characteristics = {};

bluetooth.uuid = 'b1a6752152eb4d36e13e357d7c225466';
bluetooth.services = [];

function clear() {
  if (connectionTimeout) clearTimeout(connectionTimeout); //Clear timeout
  Matrix.device.bluetooth.auth = false;
  
  if (_.has(bluetooth, 'services')) {
    //Clear characteristics' messages
    bluetooth.services.forEach(function(service) {
      service.characteristics.forEach(function(characteristic) {
        characteristic.clearMessage();
      });
    }); 
  }
}

bluetooth.start = function (callback) {

  bluetooth.stopAdvertising(function () {
    bluetooth.disconnect(); //Kill any existing connections
    bluetooth.advertising = false;
    console.log('Starting BLE configuration: ');
        
    //Notification
    var configurationNotifyCharacteristic = require("./Characteristics/configurationNotify"); //Notify X
    notify = configurationNotifyCharacteristic;

    //Registration    
    var sendIdAndSecretCharacteristic = require("./Characteristics/sendIdAndSecret"); //Write 
    bluetooth.characteristics['sendIdAndSecret'] = sendIdAndSecretCharacteristic;

    //Configuration
    var compareAuthParamsCharacteristic = require("./Characteristics/compareAuthParams"); //Write X
    bluetooth.characteristics['compareAuthParams'] = compareAuthParamsCharacteristic;
    var setNetworkCharacteristic = require("./Characteristics/setNetwork"); //Write X
    bluetooth.characteristics['setNetwork'] = setNetworkCharacteristic;
    var checkAuthCharacteristic = require("./Characteristics/checkAuth"); //Read X
    var readConfigCharacteristic = require("./Characteristics/readConfig"); //Read X
    var scanNetworksCharacteristic = require("./Characteristics/scanNetworks"); //Read X
    var characteristicList = [configurationNotifyCharacteristic, sendIdAndSecretCharacteristic, compareAuthParamsCharacteristic, checkAuthCharacteristic, readConfigCharacteristic, setNetworkCharacteristic, scanNetworksCharacteristic];

    var PrimaryService = bluetooth.PrimaryService;
    var primaryService = new PrimaryService({
      uuid: bluetooth.uuid,
      characteristics: characteristicList
    });

    bluetooth.services = [primaryService]; //Set the services

    _.once(function () {
      checkAuthCharacteristic.on('responseUpdate', function (response) {
        console.log('Auth status:', response);
        //notify.emit('responseUpdate', JSON.stringify(response));
        bluetooth.characteristics.checkAuth.emit('updateResponse', JSON.stringify(authResponse));
      });
    });

    if (bluetooth.state === 'poweredOn' && !bluetooth.advertising) {
      bluetooth.advertising = true;
      var advertisingName = Matrix.deviceId || defaultAdvertistingName;
      process.env.BLENO_DEVICE_NAME = advertisingName;
      bluetooth.startAdvertising(advertisingName, [bluetooth.uuid], function (err) {
        if (err) {
          bluetooth.advertising = false;
          console.error('Unable to start BLE advertising!');
        } else {
          console.log('Device configuration via bluetooth enabled');
        }
        if (!_.isUndefined(callback)) callback(err);
      });
    } else { 
      if (!_.isUndefined(callback)) callback(new Error('Bluetooth not ready to start advertising or already advertising'));
    };

  }); //Need to make this async

}

//Bluetooth peripheral state changes
bluetooth.on('stateChange', function (state) {
  bluetooth.state = state;
  if (state === 'poweredOn' && !bluetooth.advertising) {
    bluetooth.advertising = true;
    var advertisingName = Matrix.deviceId || defaultAdvertistingName;
    process.env.BLENO_DEVICE_NAME = advertisingName;
    bluetooth.startAdvertising(advertisingName, [bluetooth.uuid], function (err) {
      if (!err) {
        console.log('Bluetooth pairing enabled');
      } else {
        bluetooth.advertising = false;
        console.error('Unable to start bluetooth advertising');
      }
    });
  }
  
  if (state !== 'poweredOn') {
    console.log('Bluetooth is down');
    bluetooth.stopAdvertising();
  }
});

//BLE Advertising starts
bluetooth.on('advertisingStart', function (error) {

  if (error) {
    console.error("Bluetooth advertising failed");
    throw error;
  } else {
    bluetooth.advertising = true;
    //console.info("Setting BLE services");
    bluetooth.setServices(bluetooth.services);
  }
});

//When a device connects  
bluetooth.on('accept', function (clientAddress) {
  console.log('BLE device connected (' + clientAddress + ')');
  if (connectionTimeout) clearTimeout(connectionTimeout);

  if (_.isUndefined(Matrix.deviceId)) {
    //Timeout connection after 30 seconds
    connectionTimeout = setTimeout(function () {
      if (_.isUndefined(Matrix.deviceId)) {
        console.info('Device BLE registration took too long, please try again'.yellow);
        bluetooth.disconnect();
      } else {
        debug('Somehow the registration timeout wasn\'t removed');
      }
    }, registrationTimeoutSeconds * 1000);
  } else {
    console.log('BLE Device connected for configuration, requesting auth');
    connectionTimeout = setTimeout(function () {
      if (!Matrix.device.bluetooth.auth) {
        console.log('BLE Permission denied, not authorized');
        bluetooth.disconnect();
      } else {
        debug('Somehow the configuration timeout wasn\'t removed');
      }
    }, configurationTimeoutSeconds * 1000);
  }

});

//When a device disconnects
bluetooth.on('disconnect', function (clientAddress) {
  console.info('BLE device ' + clientAddress + ' disconnected');
  clear();
});


bluetooth.emitter.on('deviceAuth', function (err, uuid, options) {
  
  var authResponse = {
    characteristic: uuid,
    status: !err? 'OK' : 'ERROR',
    result: !err ? options : {},
    message: err && err.message ? err.message : ''
  }
  
  //notify.emit('updateResponse', JSON.stringify(authResponse));
  bluetooth.characteristics.sendIdAndSecret.emit('updateResponse', JSON.stringify(authResponse));

  if (!err) {
    clearTimeout(connectionTimeout);
    setTimeout(function () { 
      bluetooth.stopAdvertising(function () { //Stop any advertising
        bluetooth.disconnect(); //Kill any existing connections
      }); 
    }, 0500);
  } else {
    console.log('Device authentication failed:', err.message);
  }

});

bluetooth.emitter.on('configurationAuth', function (err, uuid, auth) {
  
  var authResponse = {
    characteristic: uuid,
    status: auth? 'OK' : 'ERROR',
    result: auth ? 'true' : 'false',
    message: err && err.message ? err.message : ''
  }
  //notify.emit('updateResponse', JSON.stringify(authResponse));
  bluetooth.characteristics.compareAuthParams.emit('updateResponse', JSON.stringify(authResponse));

  Matrix.device.bluetooth.auth = auth;
  if (auth) clearTimeout(connectionTimeout);

});


bluetooth.emitter.on('setNetwork', function (err, uuid) {

  var authResponse = {
    characteristic: uuid,
    status: !err ? 'OK' : 'ERROR',
    result: !err ? 'true' : 'false',
    message: err && err.message ? err.message : ''
  }
  //notify.emit('updateResponse', JSON.stringify(authResponse));
  bluetooth.characteristics.setNetwork.emit('updateResponse', JSON.stringify(authResponse));
  
  
});

module.exports = bluetooth;

//TODO Need this to make it run without sudo
//sudo setcap cap_net_raw+eip $(eval readlink -f `which node`) cap_net_raw+ep