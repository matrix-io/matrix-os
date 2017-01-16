var util = require('util');
var bleno = require('bleno');
var events = require('events');
var BlockCharacteristic = require('./blockCharacteristic');

function bluetooth() {
  bluetooth.super_.call(this);
}

modesEnum = {
  registration: 1,
  configuration: 2
}

bluetooth = bleno;
bluetooth.BlockCharacteristic = BlockCharacteristic;
bluetooth.emitter = new events.EventEmitter();
bluetooth.auth = false; //Used for configuration auth

bluetooth.modes = {
  [modesEnum['registration']]: {
    uuid: 'b1a6752152eb4d36e13e357d7c225466', //Matrix.config.registrationUUID
    services: []
  },
  [modesEnum['configuration']]: {
    uuid: 'b1a6752152eb4d36e13e357d7c225467', //Matrix.config.configurationUUID
    services: []
  }
}

bluetooth.registration = function (cb) {
  bluetooth.mode = modesEnum.registration;
  bluetooth.disconnect(); //Kill any existing connections
  if (bluetooth.advertising) { //Stop any advertising
    bluetooth.stopAdvertising();
    bluetooth.advertising = false;
  }

  console.log('Starting BLE registration: ');
  var sendIdAndSecretCharacteristic = require("./Characteristics/sendIdAndSecret");
  var characteristicList = [sendIdAndSecretCharacteristic];

  var PrimaryService = bluetooth.PrimaryService;
  var primaryService = new PrimaryService({
    uuid: Matrix.config.registrationUUID,
    characteristics: characteristicList
  });
  
  bluetooth.modes[bluetooth.mode].services = [primaryService]; //Set the registration services

  if (bluetooth.state === 'poweredOn' && !bluetooth.advertising) {
    console.log('Waiting for BLE pairing for device registration');
    bluetooth.startAdvertising("Matrix", [Matrix.config.registrationUUID]);
  }

  return;
}

bluetooth.configuration = function (cb) {
  bluetooth.mode = modesEnum.configuration;
  bluetooth.disconnect(); //Kill any existing connections
  if (bluetooth.advertising) { //Stop any advertising
    bluetooth.stopAdvertising();
    bluetooth.advertising = false;
  }

  console.log('Starting BLE configuration: ');
  var configurationNotifyCharacteristic = require("./Characteristics/configurationNotify"); //Notify X
  var checkIdAndSecretCharacteristic = require("./Characteristics/checkIdAndSecret"); //Write X
  var checkAuthCharacteristic = require("./Characteristics/checkAuth"); //Read X
  var readConfigCharacteristic = require("./Characteristics/readConfig"); //Read 
  var writeConfigCharacteristic = require("./Characteristics/writeConfig"); //Write 
  var characteristicList = [configurationNotifyCharacteristic, checkIdAndSecretCharacteristic, checkAuthCharacteristic, readConfigCharacteristic, writeConfigCharacteristic];

  var PrimaryService = bluetooth.PrimaryService;
  var primaryService = new PrimaryService({
    uuid: Matrix.config.configurationUUID,
    characteristics: characteristicList
  });

  bluetooth.modes[bluetooth.mode].services = [primaryService]; //Set the registration services

  if (bluetooth.state === 'poweredOn' && !bluetooth.advertising) {
    console.log('Waiting for BLE pairing for device registration');
    bluetooth.startAdvertising("Matrix", [Matrix.config.configurationUUID]);
  }

  return;
}

//Bluetooth peripheral state changes
bluetooth.on('stateChange', function (state) {
  bluetooth.state = state;
  if (!_.isUndefined(bluetooth.mode)) {
    if (state === 'poweredOn' && !bluetooth.advertising) {
      console.log('Waiting for BLE pairing for device registration');
      bluetooth.startAdvertising("Matrix", bluetooth.modes[bluetooth.mode].uuid);
    }
  } else {
    console.log('State Change: Unknown BLE mode');
  }

  if (state !== 'poweredOn') {
    console.log('BLE is down');
    bluetooth.stopAdvertising();
  }
  
});

//BLE Advertising starts
bluetooth.on('advertisingStart', function (error) {
  bluetooth.advertising = true;
  if (!_.isUndefined(bluetooth.mode)) {
    console.info("BLE Advertising started: " + (error ? "error " + error : "success"));
    if (error) {
      console.error("BLE Failed");
      throw error;
    } else {
      console.info("Setting BLE services");
      bluetooth.setServices(bluetooth.modes[bluetooth.mode].services);
    }
  } else {
    console.log('Advertising Start: Unknown BLE mode');
  }
});

//When a device connects  
bluetooth.on('accept', function (clientAddress) {
  console.log('BLE device connected (' + clientAddress + ')');

  if (bluetooth.mode === modesEnum.registration) {
    //Timeout connection after 30 seconds
    setTimeout(function () {
      console.info('Device BLE registration took too long, please try again'.yellow);
      bluetooth.disconnect();
    }, 30000);
  } else if (bluetooth.mode === modesEnum.configuration) {
    //TODO check auth
    console.log('BLE Device connected for configuration, requesting auth');
    setTimeout(function () {
      //TODO If no auth, disconnect
      console.log('BLE Permission denied, not authorized');
      bluetooth.disconnect();
    }, 20000);
  } else {
    console.log('Accept: Unknown BLE mode');
  }

});

//When a device disconnects  
bluetooth.on('disconnect', function (clientAddress) {
  bluetooth.auth = false;
  if (!_.isUndefined(bluetooth.mode)) {
    console.info('BLE device ' + clientAddress + ' disconnected');
  } else {
    console.log('Disconnect: Unknown BLE mode');
  }
});


bluetooth.emitter.on('configurationAuth', function (auth) {
  if (!auth) {
    var authFailedResponse = {
      process: 'auth',
      result: false
    }
    configurationNotifyCharacteristic.emit('updateResponse', JSON.stringify(authFailedResponse));
  }
});


module.exports = bluetooth;

//TODO Need this to make it run without sudo
//sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
