var bleno = require('bleno');
var Characteristic = bleno.Characteristic;
var PrimaryService = bleno.PrimaryService;


module.exports = {
  createCharacteristic = function(uuid, properties, secure, onReadRequest, onWriteRequest) {

    var characteristic = new Characteristic({
      "uuid": uuid,
      "properties": properties,
      "secure": secure,
      "onReadRequest": onReadRequest,
      "onWriteRequest": onWriteRequest
     });

    return characteristic;
  },
  createService = function(uuid, characteristics) {
    var primaryService = new PrimaryService({
      "uuid": uuid,
      "characteristics": characteristics
      });

    return primaryService;
  }

}
