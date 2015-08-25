var io = require('socket.io-client');
var sensors = require('adsensors');

var socket, thePort;

module.exports = {
  socket: socket,
  port: thePort,
  openSocket: function(port){
    thePort = port;
    socket = io('http://localhost:'+ port);
    socket.emit('sensor-emit', { type: 'temperature', value: Math.round(Math.random()*50) + 50 });
    setInterval( function(){
      socket.emit('sensor-emit', { type: 'temperature', value: Math.round(Math.random()*50) + 50 });
    }, config.fakeFrequency );
  },
  start: function(cb){
    setInterval( function() {
      sensors.test(function(err, d){
        if (err) return cb(err);
        log('sensor->[m]ev(sensor-emit)', d);
        Matrix.events.emit('sensor-emit', d);
        if ( !_.isUndefined(socket) ){
          log('sensor::socket:'+thePort+'(sensor-emit)->[M]', d);
          socket.emit('sensor-emit');
        }
        cb(null, d);
      });
    }, config.sensorRefresh )
  }
}
