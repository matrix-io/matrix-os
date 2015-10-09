var io = require('socket.io-client');
var socket;


module.exports = {
  init: initSocket,
  register: registerDevice,
  sendDataPoint: sendDataPoint,
  sendConfig: sendConfig,
  socket: socket,
  close: closeSocket,
  checkStreamingServer: checkStreamingServer,
  startWatcher: startServerWatcher
}

function sendConfig(data){
  console.log('[M]->SS(app-config)'.blue, data);
  // TODO: Should repeat until works
  if (checkSocket()){
    socket.emit('app-config', data);
  }
}

function startServerWatcher(){
  Matrix.socketWatcher = setInterval(function(){
    checkSocket();
  }, 5000);
}

function initSocket() {
  if ( _.isUndefined( Matrix.deviceToken )){
    return console.error('Device Token:'.grey, Matrix.deviceToken, '\nSocket requires device token. Remove db/service.db to force re-auth.'.red);
  }
  if ( !_.isUndefined(socket) && socket.connected === true){
    console.warn('why are we trying to init a connected socket?'.yellow);
  } else {
    console.log('Init Streaming Server Connection');
    // Try to avoid making more then one of these.
    socket = io(Matrix.streamingServer, { query: {deviceToken: Matrix.deviceToken}, forceNew: true, multiplex: false } );
    socket.on('connect', function() {
      socket.removeAllListeners();
      log('Socket Server Connected:'.blue, Matrix.streamingServer);
      socket.on('auth-ok', function(msg){
        console.log('Socket Server Auth:', msg);
        registerDevice();
      });

      socket.on('auth-fail', function(msg){
        console.error('Socket Authorization Fail', msg);
        socket.disconnect();
      });

      socket.on('user-authorization', function(msg) {
        // TODO: Make auth service to save auth
        console.log('ss->[M](auth)', msg);
        Matrix.events.emit('user-authorization', msg);
      });
      // TODO: Route all messages to apps
      socket.on('cli-message', function(msg) {
        console.log('ss->[M](cli-message)'.green, msg);
        Matrix.events.emit('cli-message', msg);
      });
    });
    socket.io.on('reconnect_attempt', function(n){
      console.log('socket reconnect', n, socket.id);
    })
  }
}

function closeSocket() {
  socket.disconnect();
}

// Sends to Streaming Service
function sendDataPoint(data) {
  data.deviceId = Matrix.deviceId;

  if (!checkSocket()) {
    // save data if the socket is down.

    //add device id for tracking
    Matrix.db.pending.insert({
      type: 'app-emit',
      payload: data
    });
    return;
  } else {
    // log('sent to infrastructure -- '.green, data);
    socket.emit('app-emit', data);
  }

  // Deliver pending data
  Matrix.db.pending.find({
    type: 'app-emit'
  }, function(err, points) {
    if (err) console.error(err);
    // TODO: Make this an array and handle on the other side
    if (points.length > 0) {
      _.each(points, function(p) {
        socket.emit('app-emit', p.payload);
      });
    }
    // Once sent, remove
    Matrix.db.pending.remove({
      type: 'app-emit'
    });
  });

}

function checkStreamingServer(cb){
  if ( _.isUndefined(cb) ){
    cb = function(){};
  }
  var streamOptions = require('url').parse( Matrix.streamingServer );
  require('net').connect({
    port: streamOptions.port,
    host: streamOptions.hostname
  }, function(res){
      // Initialize Streaming Server Socket
      Matrix.service.stream.init();
    cb(null);
  }).on('error', function(){
    error('No Streaming Server Visible', Matrix.streamingServer)
    cb();
  });
}

function registerDevice() {
  if (!checkSocket()) {
    return;
  }
  socket.emit('device-register', {
    deviceId: Matrix.deviceId,
    user: Matrix.user
  });
}

function checkSocket() {
  if (_.isUndefined(socket)) {
    error('Streaming Server Socket Not Initialized, trying again');
    checkStreamingServer();
    return false;
  } else if (socket.connected === false) {
    error('Streaming Server Not Connected');
    checkStreamingServer();
    return false;
  } else if (socket.disconnected) {
    error('Streaming Server Disconnected');
    checkStreamingServer();
    return false;
  }
  return true;
}
