
var io = require('socket.io-client');
var socket;


module.exports = {
  init: function(){
    socket = io(Matrix.streamingServer);
    registerDevice();
    socket.on('auth', function(msg){
      // TODO: Make auth service to save auth
      console.log('auth',msg)
    });
    socket.on('app-message', function(msg){
      console.log('ss->[M]'.green, msg);
    });
  },
  register: registerDevice,
  sendDataPoint: sendDataPoint,
  socket: socket
}

function sendDataPoint(data){
  if ( !checkSocket() ) { return; }
  socket.emit('data-point', data);
}

function registerDevice(){
  if ( !checkSocket() ) { return; }
  socket.emit('device-register', { deviceId: Matrix.deviceId });
}

function checkSocket(){
  if ( _.isUndefined(socket) ){
    error('Streaming Server Socket Not Initialized, run Matrix.service.socket.init() first');
    return false;
  }
  return true;
}
