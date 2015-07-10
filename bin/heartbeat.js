var request = require('request');
var firstHeartbeat = true;


  /*
 @method setIntervalAndExecute
 @parameter {Function} callback
 @parameter {Number} time
 @description execute a function and then call that function every 'time' seconds
 @author Julio Saldaña <julio.saldana@admobilize.com>
 */
 function setIntervalAndExecute(fn, time) {
  fn();
  return(setInterval(fn, time));
}



setIntervalAndExecute(function() {
  var url    = process.argv[4];
  var params = {
        device_token: process.argv[2],
        device_id:  process.argv[3]
      };
      if(firstHeartbeat==true)
      {
          params['first_heartbeat'] = true ;
      }
      var self = this;

      request.post({url:url, form:params}, function (error, response, body) {

        if(error){
          console.log(JSON.stringify({error: "Server not responding:" + error, url: url, params: params }));
          return;
        }
        else
        {
          if(firstHeartbeat==true)
          {
              firstHeartbeat = false;
          }
        }
        console.log(body);
      });

    }, parseInt(process.argv[5], 10));
