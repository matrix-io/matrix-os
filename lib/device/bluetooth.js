var bleno = require('bleno');
var Characteristic = bleno.Characteristic;
var PrimaryService = bleno.PrimaryService;


module.exports = {
  init: initializeBTLE,
  createCharacteristic: createCharacteristic,
  createService: createService
}

function createCharacteristic(uuid, properties, secure, onReadRequest, onWriteRequest) {

  var characteristic = new Characteristic({
    uuid: uuid,
    properties: properties,
    secure: secure,
    onReadRequest: onReadRequest,
    onWriteRequest: onWriteRequest
  });

  return characteristic;
}

function createService(uuid, characteristics) {

  var primaryService = new PrimaryService({
    uuid: uuid,
    characteristics: characteristics
  });

  return primaryService;
}

var bleno = require('bleno');

function initializeBTLE() {
  var PrimaryService = bleno.PrimaryService;
  var primaryService = new PrimaryService({
    uuid: "b1a6752152eb4d36e13e357d7c225465",
    characteristics: characteristicList
  });

  var service = [primaryService];

  console.info("SetupManager -- ==BT== Set bleno services");

  bleno.on('start', function(error) {
    console.info("SetupManager -- ==BT== on -> advertisingStart: " + (error ? "error " + error : "success"));
    Matrix.events.emit('btle-start');
    if (error) {
      console.error("SetupManager -- ==BT== Exiting");
      throw error;
    } else {
      console.info("SetupManager -- ==BT== Starting");
      bleno.setServices(
        services
      );
    }
  });


  bleno.on('accept', function(clientAddress) {
    console.info("SetupManager -- ==BT== Connection " + clientAddress);
    setTimeout(function() {
      console.info("SetupManager -- ==BT== Validate known device");
      if (userToken == "" || authStatus != "true") {
        console.info("SetupManager -- ==BT== Disconnect unknown device");
        bleno.disconnect();
      }
    }, 25000);
  });

  bleno.on('disconnect', function(clientAddress) {
    console.info("SetupManager -- ==BT== Disconnection " + clientAddress);
    Matrix.events.removeAllListeners("update-btle-response");
  });
}
