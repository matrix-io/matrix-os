//TODO Let the users now they need to give node permission to use Bluetooth without sudo
//The following command enables that
//sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)

var optional = require('optional');
var bleno = optional('bleno');
var events = require('events');

var bluetooth;

if (bleno) {
  var BlockCharacteristic = require('./blockCharacteristic');
  var connectionTimeout, advertisingTimeout, notify;

  const defaultAdvertistingName = 'MATRIX Creator';
  const registrationTimeoutSeconds = 120;
  const configurationTimeoutSeconds = 20;
  const advertisingTimeoutSeconds = 20;

  var isMac = /^darwin/.test(process.platform);

  bluetooth = bleno;
  bluetooth.BlockCharacteristic = BlockCharacteristic;
  bluetooth.emitter = new events.EventEmitter();
  bluetooth.auth = false; //Used for configuration auth
  bluetooth.characteristics = {};

  bluetooth.uuid = 'b1a6752152eb4d36e13e357d7c225466';
  bluetooth.services = [];
  bluetooth.ready = false; //Flag used so advertising only starts once it has been requested
  var ledState = 'off';

  function clear() {
    if (connectionTimeout) clearTimeout(connectionTimeout); //Clear timeout
    Matrix.device.bluetooth.auth = false;

    if (_.has(bluetooth, 'services')) {
      //Clear characteristics' messages
      bluetooth.services.forEach(function (service) {
        service.characteristics.forEach(function (characteristic) {
          characteristic.clear();
        });
      });
    }
  }
  bluetooth.updateLed = function (newState) {
    if (!_.isUndefined(newState)) ledState = newState;

    if (ledState === 'connection') Matrix.device.drivers.led.bleConnection();
    else if (ledState === 'loader') Matrix.device.drivers.led.bleLoader();
    else if (ledState === 'off') {
      Matrix.device.drivers.led.stopLoader();
      Matrix.device.drivers.led.clear();
    }
    else console.error('Unknown led state requested'.red);
  }

  bluetooth.start = function (callback) {
    if (advertisingTimeout) clearTimeout(advertisingTimeout);
    advertisingTimeout = setTimeout(function () {
      console.warn('Either you don\'t have a Bluetooth device enabled or you need to give Node permission to use it without sudo.'.yellow);
      console.warn('In order to do that you can use the command'.yellow, 'sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)'.green);
    }, advertisingTimeoutSeconds * 1000);
    bluetooth.ready = true;
    bluetooth.stopAdvertising(function () {
      if (!isMac) bluetooth.disconnect(); //Kill any existing connections
      bluetooth.advertising = false;
      debug('Starting BLE configuration: ');

      //Notification
      var configurationNotifyCharacteristic = require('./Characteristics/configurationNotify'); //Notify X
      notify = configurationNotifyCharacteristic;

      //Registration    
      var sendIdAndSecretCharacteristic = require('./Characteristics/sendIdAndSecret'); //Write 
      bluetooth.characteristics.sendIdAndSecret = sendIdAndSecretCharacteristic;

      //Configuration
      var compareAuthParamsCharacteristic = require('./Characteristics/compareAuthParams'); //Write X
      bluetooth.characteristics.compareAuthParams = compareAuthParamsCharacteristic;
      var setNetworkCharacteristic = require('./Characteristics/setNetwork'); //Write X
      bluetooth.characteristics.setNetwork = setNetworkCharacteristic;
      var readDetailsCharacteristic = require('./Characteristics/readDetails'); //Read X
      var scanNetworksCharacteristic = require('./Characteristics/scanNetworks'); //Read X
      var characteristicList = [configurationNotifyCharacteristic, sendIdAndSecretCharacteristic, compareAuthParamsCharacteristic, readDetailsCharacteristic, setNetworkCharacteristic, scanNetworksCharacteristic];

      var PrimaryService = bluetooth.PrimaryService;
      var primaryService = new PrimaryService({
        uuid: bluetooth.uuid,
        characteristics: characteristicList
      });

      bluetooth.services = [primaryService]; //Set the services

      if (bluetooth.state === 'poweredOn' && !bluetooth.advertising && bluetooth.ready) {
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
      }

    }); //Need to make this async

  }

  //Bluetooth peripheral state changes, will start advertising if it has been requested
  bluetooth.on('stateChange', function (state) {
    bluetooth.state = state;
    if (state === 'poweredOn' && !bluetooth.advertising && bluetooth.ready) {
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
      console.log('Bluetooth is down', state);
      bluetooth.stopAdvertising();
      clear();
      Matrix.device.drivers.led.criticalError(function () {
        bluetooth.updateLed('off');
      });
    }
  });

  //BLE Advertising starts
  bluetooth.on('advertisingStart', function (error) {
    if (error) {
      console.error('Bluetooth advertising failed, please make sure your Node installation has Bluetooth permissions.'.yellow, 'The following commands ensures that'.yellow, 'sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)'.green);
      throw error;
    } else {
      if (advertisingTimeout) clearTimeout(advertisingTimeout);
      if (_.isUndefined(Matrix.deviceId)) bluetooth.updateLed('loader');
      bluetooth.advertising = true;
      bluetooth.setServices(bluetooth.services);
    }
  });

  //When a device connects  
  bluetooth.on('accept', function (clientAddress) {
    console.log('BLE device connected (' + clientAddress + ')');
    bluetooth.updateLed('connection');
    if (connectionTimeout) clearTimeout(connectionTimeout);

    if (_.isUndefined(Matrix.deviceId)) {
      //Timeout connection after 30 seconds
      connectionTimeout = setTimeout(function () {
        if (_.isUndefined(Matrix.deviceId)) {
          console.info('Device BLE registration took too long, please try again'.yellow);
          if (!isMac) bluetooth.disconnect();
        } else {
          debug('Somehow the registration timeout wasn\'t removed');
        }
      }, registrationTimeoutSeconds * 1000);
    } else {
      console.log('BLE Device connected for configuration, requesting auth');
      connectionTimeout = setTimeout(function () {
        if (!Matrix.device.bluetooth.auth) {
          console.log('BLE connection timeout, not authenticated');
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
    bluetooth.updateLed('off');
    if (_.isUndefined(Matrix.deviceId)) bluetooth.updateLed('loader');
  });


  bluetooth.emitter.on('deviceAuth', function (err, uuid, options) {

    var authResponse = {
      status: !err ? 'OK' : 'ERROR',
      result: !err ? options : {},
      message: err && err.message ? err.message : ''
    }

    //notify.emit('updateResponse', JSON.stringify(authResponse));
    bluetooth.characteristics.sendIdAndSecret.emit('updateResponse', JSON.stringify(authResponse));

    if (!err) {
      clearTimeout(connectionTimeout);
      console.log('Restarting bluetooth due to successful device registration...');
      bluetooth.updateLed('off');
      setTimeout(function () {
        bluetooth.stopAdvertising(function () { //Stop any advertising
          if (!isMac) bluetooth.disconnect(); //Kill any existing connections
        });
      }, 0500);
    } else {
      console.log('Device registration failed:', err.message);
    }

  });

  bluetooth.emitter.on('configurationAuth', function (err, uuid, auth) {

    var authResponse = {
      status: auth ? 'OK' : 'ERROR',
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
      status: !err ? 'OK' : 'ERROR',
      result: !err ? 'true' : 'false',
      message: err && err.message ? err.message : ''
    }
    //notify.emit('updateResponse', JSON.stringify(authResponse));
    bluetooth.characteristics.setNetwork.emit('updateResponse', JSON.stringify(authResponse));


  }); 
}

module.exports = bluetooth;