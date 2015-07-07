
var _ = require('lodash');



/**
 * @method updateDevice
 * @description Update a device information( name or description)
 */


var updateDevice = function(deviceData, callback) {

  if (deviceData.name || deviceData.description == "" || deviceData.description) {
    var url = config.url.device.update;

    var params = {
      access_token: Matrix.activeUser.accessToken,
      device_token: Matrix.activeDevice.accessToken,
    };

    _.extend(params, deviceData);
    request.post({
      url: url,
      form: params
    }, function(err, response, body) {

      if (err) {
        console.log(err);
        callback(new Error('Server not responding'), {});
        return;
      }

      try {
        var responseJSON = JSON.parse(body);

        if (responseJSON.status == 'OK') {

          callback();
        } else {
          console.log('body response ' + body);
          callback(new Error(' Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);
        }
      } catch (error) {
        var statusCode = response ? response.statusCode : "";
        callback(new Error('Error trying to update device  , error ' + statusCode), {
          error: "Update device error"
        });
        return;
      }
    });
  } else {
    callback(new Error("device name or devide description value is missing"));
  }

}

module.exports = {
  update: updateDevice
}