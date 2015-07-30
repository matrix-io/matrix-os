var bleno = require('bleno');
var Characteristic = bleno.Characteristic;
var PrimaryService = bleno.PrimaryService;


module.exports = {
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
