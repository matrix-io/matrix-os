var _ = require('lodash');
var formData = require('form-data');

   /**
   * @method submitDataPoint
   * @description Submit data from a point
   * @param {User} user
   * @param {Object} (optional) dataJSON The data point JSON encoded. e.g. {"ty":"mc","cl":{"loc_type":0,"si":9,"aps":false},"sr":[]}
   * @param {Function} callback(error,responseJSON)
   */

function submitDataPoint (dataJSON, fileData, cb) {
    var url = config.url.device.submit;
    var self = this;
    var form = new formData();
    if ( _.isUndefined( cb )){
      // handle 2 args
      cb = fileData;
    }

    var requestPost = request.post(url, function (err, response, body) {

    if (err) {
      // server error
      cb(new Error('Server unavailable'), {
        error: 'Server unavailable: ' + err
      });
    } else if (response.statusCode !== 200) {
      // service error
      var statusCode = response ? response.statusCode : '';
      cb(new Error('Error submitting data (' + statusCode + ')'), {
        error: "Error submitting data"
      });
    } else if (responseJSON.status !== 'OK') {
      // payload error
      if (typeof responseJSON.error == 'String') {
        cb(new Error('Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);
      } else {
        cb(new Error('Error ' + responseJSON.status_code), responseJSON);
      }
    } else {
      //success
      var responseJSON = JSON.parse(body);
      if (responseJSON.status == 'OK') {
        self.setDeviceToken(responseJSON.results['device_token']);
        cb(null, responseJSON);
      } else {
        if (typeof responseJSON.error == 'String') {
          cb(new Error('Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);
        } else {
          cb(new Error('Error ' + responseJSON.status_code), responseJSON);
        }
      }
    });

    var form = requestPost.form();

    // applies on next steps
    form.append('device_token', this.getDeviceToken());
    form.append('data_point', JSON.stringify(dataJSON));
    if( !_.isFunction(fileData) ) ){
      form.append('file',fileData);
    }
  }

  module.exports = {
    submit: submitDataPoint
  }