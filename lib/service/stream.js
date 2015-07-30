
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
    // TODO: Route all messages“”
    socket.on('app-message', function(msg){
      console.log('ss->[M]'.green, msg);
    });
  },
  register: registerDevice,
  sendDataPoint: sendDataPoint,
  socket: socket,
  close: closeSocket
}

function closeSocket(){
  socket.close();
}

// Sends to Streaming Service
function sendDataPoint(data){
  if ( !checkSocket() ) {
    // TODO: This seems like a good point to ensure the data is saved, if the socket is down.
    Matrix.db.pending.insert({ type: 'data-point', payload: data });
    return;
  }

  // FIXME: Test this
  Matrix.db.pending.find({type: 'data-point'}, function(err, points){
    _.each(points, function(p){
      socket.emit('data-point', p.payload);
    });
    Matrix.db.pending.remove({type:'data-point'});
  });

  socket.emit('data-point', data);
}

function registerDevice(){
  if ( !checkSocket() ) { return; }
  socket.emit('device-register', { deviceId: Matrix.deviceId });
}

function checkSocket(){
  if ( _.isUndefined(socket) ){
    error('Streaming Server Socket Not Initialized, run Matrix.service.stream.init() first');
    return false;
  } else if ( socket.connected === false ){
    error('Streaming Server Not Connected');
    return false;
  } else if ( socket.disconnected ) {
    error('Streaming Server Disconnected');
    return false;
  }
  return true;
}
