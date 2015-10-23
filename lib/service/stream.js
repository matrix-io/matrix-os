var url = require('url');
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

function sendConfig(data) {
  // TODO: Should repeat until works
  if (checkSocket()) {
    console.log('[M]->SS(app-config)'.blue, data);
    socketEmit('app-config', data);
  }
}

function startServerWatcher() {
  Matrix.socketWatcher = setInterval(function() {
    checkSocket();
  }, 5000);
}

function initSocket(cb) {
  if (_.isUndefined(Matrix.deviceToken)) {
    return console.error('Device Token:'.grey, Matrix.deviceToken, '\nSocket requires device token. Remove db/service.db to force re-auth.'.red);
  }

  var sUrl = url.parse(Matrix.streamingServer);
  // sUrl.protocol = 'ws:';
  sUrl.pathname = 'engine.io';
  sUrl.query = {
    deviceToken: Matrix.deviceToken
  };



  socket = require('engine.io-client')(url.format(sUrl));
  console.log('Init Streaming Server:'.green, url.format(sUrl));
  // Try to avoid making more then one of these.
  // socket = io(Matrix.streamingServer, { transports: [ 'websockets' ], query: {deviceToken: Matrix.deviceToken}, forceNew: true, multiplex: false } );
  socket.on('open', function() {


    // socket.removeAllListeners();
    log('Socket Server Connected:'.blue, Matrix.streamingServer);
    socket.on('message', function(msg) {
      // log('message', msg);
      try {
        msg = JSON.parse(msg);
      } catch (e) {
        console.error(e);
      }

      switch (msg.channel) {
        case 'auth-ok':
          console.log('Socket Server Auth:', msg);
          registerDevice();
          break;
        case 'auth-fail':
          console.error('Socket Authorization Fail', msg);
          socket.close();
          break;
        case 'user-authorization':
          // TODO: Make auth service to save auth
          console.log('ss->[M](auth)', msg);
          Matrix.events.emit('user-authorization', msg.payload);
          break;
        case 'cli-message':
          console.log('ss->[M](cli-message)'.green, msg);
          Matrix.events.emit('cli-message', msg.payload);
          break;
        case 'register-ok':
          console.log('Matrix registration ok');
          // kickoff whatever else is waiting for init
          (_.isFunction(cb)) ? cb() : null;
          break;
        default:
          console.log('No handler for channel:', msg.channel);
      }
    });
  });

  socket.on('close', function() {
    console.log('socket close: ', socket.id);

    // try again
    setTimeout(function(){
      Matrix.service.stream.init();
    }, 5000)
  })

  socket.on('flush', function() {
    console.log('socket flush', socket.id);
  })

  socket.on('upgrade', function(n) {
    // console.log('socket upgrade', n, socket.id);
  });

  socket.on('upgradeError', function(n) {
    console.log('socket upgrade error', n, socket.id);
  });

  socket.on('error', function(err) {
    console.error('socket error', err, err.stack)
  })
}

function closeSocket() {
  socket.close();
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
    socketEmit('app-emit', data);
  }

  // Deliver pending data
  Matrix.db.pending.find({
    type: 'app-emit'
  }, function(err, points) {
    if (err) console.error(err);
    // TODO: Make this an array and handle on the other side
    if (points.length > 0) {
      _.each(points, function(p) {
        socketEmit('app-emit', p.payload);
      });
    }
    // Once sent, remove
    Matrix.db.pending.remove({
      type: 'app-emit'
    });
  });

}

function checkStreamingServer(cb) {
  if (_.isUndefined(cb)) {
    cb = function() {};
  }
  var streamOptions = require('url').parse(Matrix.streamingServer);
  require('net').connect({
    port: streamOptions.port,
    host: streamOptions.hostname
  }, function(res) {
    Matrix.service.stream.init(cb);
  }).on('error', function() {
    error('No Streaming Server Visible', Matrix.streamingServer)
    setTimeout(function(){
      cb();
    },5000);
  });
}

function registerDevice() {
  if (!checkSocket()) {
    return;
  }
  socketEmit('device-register', {
    deviceId: Matrix.deviceId,
    user: Matrix.user
  });
}

function checkSocket() {
  function recheck() {
    setTimeout(function() {
      checkStreamingServer();
    }, 5000);
    return false;
  }

  if (_.isUndefined(socket)) {
    error('Streaming Server Socket Not Initialized, trying again');
    return recheck();
  } else if (socket.connected === false) {
    error('Streaming Server Not Connected');
    return recheck();
  } else if (socket.disconnected) {
    error('Streaming Server Disconnected');
    return recheck();
  }
  return true;
}

function socketEmit(channel, payload) {
  socket.send(JSON.stringify({
    channel: channel,
    payload: payload
  }));
}
