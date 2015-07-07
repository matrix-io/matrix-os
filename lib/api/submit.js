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

function startHeartbeat() {
     var spawn = require('child_process').spawn;

      var parameters = new Array();
      parameters.push(config.settings.admobilizeSDKRootPath + 'bin/heartbeat.js');
      parameters.push(Matrix.activeDevice.token);
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