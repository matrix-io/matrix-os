
var appName = require('path').basename(__dirname).split('.')[0];
console.log('Welcome to', appName);

module.exports = {
  send : function(message){
    process.send({ type: 'app-data', name: appName, payload: message });
  },
  receive: receiveHandler,
  init : initSensor
}



function receiveHandler(cb){
  console.log('util receive');

  process.on('message', function(m) {
    cb(null, m);
  });

  process.on('error', function(err){
    if (err) return cb(err);
  });

  process.on('disconnect', function(w){
    console.log(appName ,': disconnect', w);
  });

  process.on('exit', function(){
    //handle exit
    console.log(appName, ': exit', arguments );
  });
}


function initSensor(name, options, cb){
  process.send({type: 'sensor-init', name: name, options: options });

  process.on('message', function(m){
    if ( m.type === 'sensor-event' ){
      console.log('app:[M]->app t:sensor-event', name, m.payload );
    }
  });

  return {
      stream: function(){
        // var http = require('http');
        // var server = http.createServer(function (req, res) {
        //
        // });
        // require('portfinder').getPort(function(port){
        //     server.listen(port);
        // });

        var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;
        return new EventFilter(name);
      }
  }

  // .stream generate a stream
}
