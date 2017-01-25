
var util = require('util');
var Characteristic = require('../blockCharacteristic');


var userToken = "";
var uuid = '2A17';

var CompareAuthParamsCharacteristic = function () {
  CompareAuthParamsCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write']
  });
};

util.inherits(CompareAuthParamsCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

/*CompareAuthParamsCharacteristic.prototype.setUserToken = function (token){ 
  userToken = token;
};*/

function compareAuthParam(options) {
  var err;
  try {
    options = JSON.parse(options);
  } catch (error) {
    err = new Error('Unable to parse content ' + options);
  }

  if (!err && !_.has(options, 'secret')) {
    err = new Error('Parameter missing ' + options);
  }

  var auth = options.secret === Matrix.deviceSecret;
  return Matrix.device.bluetooth.emitter.emit('configurationAuth', err, auth);
}

var compareAuthParamsCharacteristic = new CompareAuthParamsCharacteristic();
compareAuthParamsCharacteristic.on("newData", compareAuthParam.bind(compareAuthParamsCharacteristic));
module.exports = compareAuthParamsCharacteristic;