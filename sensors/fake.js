var io = require('socket.io-client');

module.exports = {
  init: function(port){
    var socket = io('http://localhost:'+ port);
    setInterval( function(){
      log('pooop');
      socket.emit('data-point', { type: 'temperature', value: Math.round(Math.random()*50) + 50 });
    }, 1000);
  }
}
