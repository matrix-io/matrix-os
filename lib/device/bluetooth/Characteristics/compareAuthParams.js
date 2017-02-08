
var util = require('util');
var Characteristic = require('../blockCharacteristic');


var userToken = "";
var uuid = '2A17';

var CompareAuthParamsCharacteristic = function () {
  CompareAuthParamsCharacteristic.super_.call(this, {
    uuid: uuid,
    properties: ['write', 'notify']
  });
};

util.inherits(CompareAuthParamsCharacteristic, Matrix.device.bluetooth.BlockCharacteristic);

/*CompareAuthParamsCharacteristic.prototype.setUserToken = function (token){ 
  userToken = token;
};*/

function compareAuthParam(options) {
  var err;
  var options = Matrix.service.cypher.decrypt(options, '');
  if (!_.isUndefined(Matrix.deviceId)) {
    try {
      options = JSON.parse(options);
    } catch (error) {
      err = new Error('Unable to parse content ' + options);
    }

    if (!err && !_.has(options, 'secret')) {
      err = new Error('Parameter missing ' + JSON.stringify(options));
    }

    var auth = options.secret === Matrix.deviceSecret; 
  } else {
    err = new Error('Devices in not registered');
  }
  return Matrix.device.bluetooth.emitter.emit('configurationAuth', err, uuid, auth);
}

var compareAuthParamsCharacteristic = new CompareAuthParamsCharacteristic();
compareAuthParamsCharacteristic.on("newData", compareAuthParam.bind(compareAuthParamsCharacteristic));
module.exports = compareAuthParamsCharacteristic;