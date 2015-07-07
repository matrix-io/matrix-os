
function startHeartbeat() {
     var spawn = require('child_process').spawn;

      var parameters = new Array();
      parameters.push();

      var heartbeatProcess = spawn('node', [
        __dirname+'/../../bin/heartbeat.js',
        Matrix.activeDevice.token,
        Matrix.activeDevice.deviceId,
        config.url.device.heartbeat,
        config.heartbeatInterval
      ]);


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
  start: startHeartbeat
}