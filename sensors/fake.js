var io = require('socket.io-client');

module.exports = {
  init: function(port){
    var socket = io('http://localhost:'+ port);
    socket.emit('sensor-emit', { type: 'temperature', value: Math.round(Math.random()*50) + 50 });
    setInterval( function(){
      socket.emit('sensor-emit', { type: 'temperature', value: Math.round(Math.random()*50) + 50 });
    }, config.fakeFrequency );
  }
}
