var util = require('util');
var bleno = require('bleno');
var events = require('events');
var BlockCharacteristic = require('./blockCharacteristic');

function bluetooth() {
  bluetooth.super_.call(this);
}

bluetooth = bleno;
bluetooth.BlockCharacteristic = BlockCharacteristic;
bluetooth.emitter = new events.EventEmitter();

bluetooth.modes = {
  registration: 1,
  configuration: 2
}

bluetooth.services = [];

bluetooth.registration = function (cb) {
  bluetooth.mode = bluetooth.modes.registration;
  bluetooth.disconnect(); //Kill any existing connections
  if (bluetooth.advertising) bluetooth.stopAdvertising(); //Stop any advertising

  console.log('Starting BLE registration: ');
  var sendIdAndSecretCharacteristic = require("./Characteristics/sendIdAndSecret");
  var readSomethingCharacteristic = require("./Characteristics/readSomething");
  var characteristicList = [sendIdAndSecretCharacteristic, readSomethingCharacteristic];

  console.log(1);  
  var PrimaryService = bluetooth.PrimaryService;
  var primaryService = new PrimaryService({
    uuid: Matrix.config.registrationUUID,
    characteristics: characteristicList
  });
  console.log(2);

  bluetooth.services[bluetooth.mode] = [primaryService]; //Set the registration services
  console.log(3);
  console.log('Checking current state:', bluetooth.state, bluetooth.advertising);  
  if (bluetooth.state === 'poweredOn' && !bluetooth.advertising) {
    console.log('Waiting for BLE pairing for device registration');
    bluetooth.startAdvertising("Matrix", [Matrix.config.registrationUUID]);
  }

  return;
}

bluetooth.on('stateChange', function (state) {
  bluetooth.state = state;
  if (bluetooth.mode === bluetooth.modes.registration) {
    if (state === 'poweredOn' && !bluetooth.advertising) {
      console.log('Waiting for BLE pairing for device registration');
      bluetooth.startAdvertising("Matrix", [Matrix.config.registrationUUID]);
    } else {
      console.log('BLE advertising stopped');
      bluetooth.stopAdvertising();
    }
  } else {
    console.log('State Change: Unknown BLE mode');
    if (state !== 'poweredOn') {
      console.log('BLE is down');
      bluetooth.stopAdvertising();
    }
  }
  
});

bluetooth.on('advertisingStart', function (error) {
  bluetooth.advertising = true;
  if (bluetooth.mode === bluetooth.modes.registration) {
    console.info("BLE Advertising started: " + (error ? "error " + error : "success"));
    if (error) {
      console.error("BLE Failed");
      throw error;
    } else {
      console.info("Setting BLE services");
      bluetooth.setServices(bluetooth.services[bluetooth.mode]);
    }
  } else {
    console.log('Advertising Start: Unknown BLE mode');
  }
});

//When a device connects  
bluetooth.on('accept', function (clientAddress) {
  console.log('BLE device connected (' + clientAddress + ')');

  if (bluetooth.mode === bluetooth.modes.registration) {
    //Timeout connection after 30 seconds
    setTimeout(function () {
      console.info('Device BLE registration took too long, please try again'.yellow);
      bluetooth.disconnect();
    }, 30000);
  } else {
    console.log('Accept: Unknown BLE mode');
  }

});

//When a device disconnects  
bluetooth.on('disconnect', function (clientAddress) {
  if (bluetooth.mode === bluetooth.modes.registration) {
    console.info('BLE device ' + clientAddress + ' disconnected');
  } else {
    console.log('Disconnect: Unknown BLE mode');
  }
});

//When the status of BLE changes
/*bluetooth.emitter.on('stateChange', function (state) {
  bluetooth.state = state;
  console.log("State", state);
  if (state == "poweredOn") {
    console.log('Waiting for BLE pairing for device registration');
    bluetooth.startAdvertising("Matrix", [Matrix.config.registrationUUID]);
  } else {
    console.log('BLE advertising stopped');
    bluetooth.stopAdvertising();
  }

});*/


module.exports = bluetooth;

//TODO Need this to make it run without sudo
//sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
