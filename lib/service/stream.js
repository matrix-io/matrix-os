
var io = require('socket.io-client');
var socket;


module.exports = {
  init: function(){
    socket = io(Matrix.streamingServer);
    socket.on('connect', function(){
      log('Socket Server Connected:'.blue, Matrix.streamingServer);
      registerDevice();
      socket.on('user-authorization', function(msg){
        // TODO: Make auth service to save auth
        console.log('ss->[M](auth)', msg);
        Matrix.events.emit('user-authorization', msg);
      });
      // TODO: Route all messages to apps
      socket.on('cli-message', function(msg){
        console.log('ss->[M](cli-message)'.green, msg);
        Matrix.events.emit('cli-message', msg);
      });
    })
    socket.on('disconnect', function(){
      log('Socket Disconnected')
    });
  },
  register: registerDevice,
  sendDataPoint: sendDataPoint,
  socket: socket,
  close: closeSocket
}

function closeSocket(){
  socket.disconnect();
}

// Sends to Streaming Service
function sendDataPoint(data){
  data.deviceId = Matrix.deviceId;

  if ( !checkSocket() ) {
    // save data if the socket is down.

    //add device id for tracking
    Matrix.db.pending.insert({ type: 'sensor-emit', payload: data });
    return;
  } else {
   log('device->[M]->SS'.green, data);
    socket.emit('sensor-emit', data);
  }

  // Deliver pending data
  Matrix.db.pending.find({type: 'sensor-emit'}, function(err, points){
    if (points.length > 0){
      _.each(points, function(p){
        socket.emit('sensor-emit', p.payload);
      });
    }
    // Once sent, remove
    Matrix.db.pending.remove({type:'sensor-emit'});
  });

}

function registerDevice(){
  if ( !checkSocket() ) { return; }
  socket.emit('device-register', { deviceId: Matrix.deviceId, user: Matrix.user });
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
