
var appName = require('path').basename(__dirname).split('.')[0];
console.log('Welcome to', appName);

module.exports = {
  send : function(message){
    process.send({ type: 'app-data', appName: appName, payload: message });
  },
  recieve: recieveHandler,
  initSensor: initSensor
}


function recieveHandler(cb){
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
  // .stream generate a stream
  // .detect for cameras, also generates stream
}
