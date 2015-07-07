/* Handles Communication with API Layer */

var auth = require('./auth');

module.exports = {}


   /**
   * @method submitDataPoint
   * @description Submit data from a point
   * @param {User} user
   * @param {Object} dataJSON The data point JSON encoded. e.g. {"ty":"mc","cl":{"loc_type":0,"si":9,"aps":false},"sr":[]}
   * @param {Function} callback(error,responseJSON)
   */

  submitDataPoint = function(dataJSON, fileData , cb) {
    var url = config.url.device.submit;
    var self = this;
    var form = new formData();
    var requestPost = request.post(url, function (error, response, body) {

      if(error){
        cb(new Error('Server unavailable'),{error:"Server unavailable"});
      } else {
        try{
          var responseJSON = JSON.parse(body);
          if(responseJSON.status == 'OK'){
            self.setDeviceToken(responseJSON.results['device_token']);
            cb(null, responseJSON);
          }else{
            if(typeof responseJSON.error == 'String'){
              cb(new Error('Error ' + responseJSON.status_code + ' ' +responseJSON.error), responseJSON);
            }else{
              cb(new Error('Error ' + responseJSON.status_code), responseJSON);
            }
          }
        }catch(err){
          var statusCode = response ? response.statusCode : "";
          cb(new Error('Error submitting data (' + statusCode + ')'), {error: "Error submitting data"});
          return;
        }
      }
    });

    var form = requestPost.form();

    form.append('device_token', this.getDeviceToken());
    form.append('data_point', JSON.stringify(dataJSON));
    if(fileData){
      form.append('file',fileData);
    }

  }