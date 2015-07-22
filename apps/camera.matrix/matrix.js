
var appName = require('path').basename(__dirname).split('.')[0];
console.log('Welcome to', appName);

var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;
var apply = require('admobilize-eventfilter-sdk').apply;
var _ = require('lodash');

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

  // process.on('message', function(m){
  //   console.log('yay!');
  //   if ( m.type === 'sensor-event' ){
  //     console.log('app:[M]->app t:sensor-event', name, m.value );
  //   }
  // });

  var filter = new EventFilter(name);

  var then = function(cb){
    process.on('message', function(m){
      if ( m.type === 'sensor-event' ){
        console.log('app:[M]->app t:sensor-event', name, m.value );
        //apply sensor
        cb(null, m.value);
      } else {
        cb(new Error('Invalid Message from Matrix', m));
      }
    });
  }

  _.extend(filter, { then: then });

  return filter;
}
