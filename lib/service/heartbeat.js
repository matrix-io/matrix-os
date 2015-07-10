
function startHeartbeat() {
     var spawn = require('child_process').spawn;

     Matrix.event.heartbeat.init();

     var args = [
        __dirname+'/../../bin/heartbeat.js',
        Matrix.state.device.token,
        Matrix.state.device.id,
        Matrix.config.url.device.heartbeat,
        Matrix.config.heartbeatInterval
      ]

      var heartbeatProcess = spawn('node', args);

      log(args);


      //on the heartbeat response
     heartbeatProcess.stdout.on('data', function(data) {

      try {

        var dataJSON = JSON.parse(data);
        console.log(dataJSON);
        if (dataJSON.error) {

          if (dataJSON.error == 'Token has expired') {
            console.log('Token has expired');
            self.stopHeartbeat();
            self.authenticator.refreshUserToken(self.getUser(), function(error, responseJSON) {
              if (!error) {
                self.startHeartbeat();
              }
            });
          } else {

            isAlive = false;
            Matrix.events.emit('heartbeat-response', false);
          }
        } else {
          isAlive = true;
          if (dataJSON.results.pusher_event) {
            Matrix.events.emit('heartbeat-response', true, dataJSON.results.pusher_event);
          } else {
            Matrix.events.emit('heartbeat-esponse', true);
          }

        }
        //console.log('heartbeat response: ' + data);

      } catch (error) {
        console.log(error);
        isAlive = false;
        Matrix.events.emit('heartbeat-response', false);
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