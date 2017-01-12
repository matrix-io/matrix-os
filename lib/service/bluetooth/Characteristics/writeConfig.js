
var util = require('util');
var Characteristic = require('../blockCharacteristic');


var userToken = "";
var uuid = '2A22';

var WriteConfigCharacteristic = function () {
  WriteConfigCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write']
  });
};

util.inherits(WriteConfigCharacteristic, Matrix.service.bluetooth.BlockCharacteristic);

WriteConfigCharacteristic.prototype.setUserToken = function (token) {
  userToken = token;
};

function writeConfig(options) {

  //TODO Need to actually write the config somewhere
  console.log('BLE characteristic received a string: ', options);

  try {
    console.log('Parsing string received');
    options = JSON.parse(options);
  } catch (error) {
    return console.log('Failed to parse :(');
  }

  if (!_.has(options, 'id') || !_.has(options, 'secret')) {
    return console.log('Options missing  :(');
  }

  console.log('Success!');
  Matrix.service.bluetooth.emitter.emit('configWritten', options);
  return;
}

var writeConfigCharacteristic = new WriteConfigCharacteristic();
writeConfigCharacteristic.on("newData", writeConfig.bind(writeConfigCharacteristic));
module.exports = writeConfigCharacteristic;