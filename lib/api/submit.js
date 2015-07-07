var _ = require('lodash');

   /**
   * @method submitDataPoint
   * @description Submit data from a point
   * @param {User} user
   * @param {Object} (optional) dataJSON The data point JSON encoded. e.g. {"ty":"mc","cl":{"loc_type":0,"si":9,"aps":false},"sr":[]}
   * @param {Function} callback(error,responseJSON)
   */

function submitDataPoint (dataJSON, fileData, cb) {
    var url = config.url.device.submit;
    if ( _.isUndefined( cb )){
      // handle 2 args
      cb = fileData;
    }

    var requestPost = Matrix.service.post({url:url}, function( err, response ){
      if (err) return cb(err);
      Matrix.activeDevice.token = response.results.device_token;
      cb(null, response);
    });

    var form = requestPost.form();

    // applies on next steps
    form.append('device_token', Matrix.activeDevice.token );
    form.append('data_point', JSON.stringify(dataJSON));
    if( !_.isFunction(fileData) ) {
      form.append('file',fileData);
    }
  }

  module.exports = {
    submit: submitDataPoint
  }