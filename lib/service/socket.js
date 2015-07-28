
var io = require('socket.io-client');
var socket;


module.exports = {
  init: function(){
    socket = io(Matrix.streamingServer);
    registerDevice();
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
