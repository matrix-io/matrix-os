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
    var self = this;
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
          error: 'Error submitting data'
        });
      } else {
        // valid response sent
        var responseJSON = JSON.parse(body);

        if ( responseJSON.status !== 'OK') {
          // payload error
          if (_.isString( responseJSON.error ))  {
            cb(new Error('Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);
          } else {
            cb(new Error('Error ' + responseJSON.status_code), responseJSON);
          }
        } else if (responseJSON.status === 'OK') {
          // success
          self.setDeviceToken(responseJSON.results.device_token );
          cb(null, responseJSON);
        }
      }
    });

    var form = requestPost.form();

    // applies on next steps
    form.append('device_token', this.getDeviceToken());
    form.append('data_point', JSON.stringify(dataJSON));
    if( !_.isFunction(fileData) ) {
      form.append('file',fileData);
    }
  }

function startHeartbeat() {
     var spawn = require('child_process').spawn;

      var parameters = new Array();
      parameters.push(config.settings.admobilizeSDKRootPath + 'daemons/heartbeat.js');
      parameters.push(self.getDeviceToken());
      parameters.push(self.getDeviceId());
      parameters.push(config.settings.apiHost);
      parameters.push(config.settings.heartbeatPath);
      parameters.push(config.settings.heartbeatInterval);

      var heartbeatProcess = spawn('node',parameters);


      //on the heartbeat response
     heartbeatProcess.stdout.on('data', function(data) {

      try{

      var dataJSON = JSON.parse(data);

      if(dataJSON.error){

        if(dataJSON.error == "Token has expired"){
          console.log("Token has expired");
          self.stopHeartbeat();
          self.authenticator.refreshUserToken(self.getUser(),function (error, responseJSON) {
            if(!error){
             self.startHeartbeat();
           }
         });
        }else{

          isAlive = false;
          self.emit("heartbeatResponse", false);
        }
      }else{
       isAlive = true;
       if(dataJSON.results.pusher_event){
          self.emit("heartbeatResponse", true ,dataJSON.results.pusher_event);
       }else{
          self.emit("heartbeatResponse", true);
       }

     }
     //console.log('heartbeat response: ' + data);

   }catch(error){
      console.log(error);
      isAlive = false;
      self.emit("heartbeatResponse", false);
   }
   });

     heartbeatProcess.stderr.on('data', function(data) {
      console.error('heartbeat error:  ' + data);
    });

    heartbeatProcess.on('close', function(code) {
      console.log('closing hearbeat code: ' + code);
    });

   }

  module.exports = {
    submit: submitDataPoint
  }