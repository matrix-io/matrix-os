var url = require('url');
var socket;
var debug = debugLog('stream');

module.exports = {
  init: initSocket,
  register: registerDevice,
  sendDataPoint: sendDataPoint,
  sendConfig: sendConfig,
  socket: socket,
  close: closeSocket,
  checkStreamingServer: checkStreamingServer,
  startWatcher: startSocketWatch
}

function sendConfig(data) {
  // Should repeat until works
  if (checkSocket()) {
    debugLog('app')('[M]->SS(app-config)'.blue, data);
    socketEmit('app-config', data);
  }
}

function startSocketWatch() {
  debug('Start Socket Watch');
  Matrix.socketWatcher = setTimeout(function(){
      Matrix.config.socketCheckDelay = Math.round(Matrix.config.socketCheckDelay * 1.5);
      debug('Socket Watch', Matrix.config.socketCheckDelay);
      checkSocket();
    }, Matrix.config.socketCheckDelay);
}

function stopSocketWatch() {
  debug('Stop Socket Watch')
  clearTimeout(Matrix.socketWatcher);
}


function retrySocket() {
  debug('Retry Socket Connection')
  checkSocket();
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
    // hit server, reset rolling delay
    Matrix.config.socketCheckDelay = 500;
    Matrix.service.stream.init(cb);
  }).on('error', function() {
    error('No Streaming Server Visible', Matrix.streamingServer);

    Matrix.service.stream.startWatcher();


    if (_.isFunction(cb)) {
      cb();
    }
  });
}

function checkSocket() {
  function recheck() {
    checkStreamingServer();
    return false;
  }

  if (_.isUndefined(socket)) {
    error('Streaming Server Socket Not Initialized, trying again');
    return recheck();
  } else if (_.isNull(socket.id) || socket.connected === false) {
    error('Streaming Server Not Connected');
    return recheck();
  } else if (socket.disconnected) {
    error('Streaming Server Disconnected');
    return recheck();
  }

  return true;
}

function initSocket(cb) {
  if (_.isUndefined(Matrix.deviceToken)) {
    return error('Device Token:'.grey, Matrix.deviceToken, '\nSocket requires device token. Remove db/service.db to force re-auth.'.red);
  }

  var sUrl = url.parse(Matrix.streamingServer);
  // sUrl.protocol = 'ws:';
  sUrl.pathname = 'engine.io';
  sUrl.query = {
    deviceToken: Matrix.deviceToken
  };

  // clear the retry
  stopSocketWatch();

  socket = require('engine.io-client')(url.format(sUrl));
  log('Init Streaming Server:'.green, url.format(sUrl));
  // Try to avoid making more then one of these.
  // socket = io(Matrix.streamingServer, { transports: [ 'websockets' ], query: {deviceToken: Matrix.deviceToken}, forceNew: true, multiplex: false } );
  socket.on('open', function() {

    // socket.removeAllListeners();
    log('Socket Server Connected:'.blue, Matrix.streamingServer, socket.id);



    socket.on('message', function(msg) {
      try {
        msg = JSON.parse(msg);
      } catch (e) {
        error(e);
      }

      switch (msg.channel) {
        case 'auth-ok':
          debug('Socket Server Auth:', msg);
          registerDevice();
          break;
        case 'auth-fail':
          error('Socket Authorization Fail', msg);
          socket.close();
          //kick off reauthorization
          log('Matrix Reauthorizing...'.yellow)
          Matrix.service.auth.authenticate();
          break;
        case 'cli-message':
          debug('ss->[M](cli-message)'.green, msg);
          Matrix.events.emit('cli-message', msg.payload);
          break;
        case 'register-ok':
          log('Matrix registration ', 'OK'.green);
          // kickoff whatever else is waiting for init
          _.each(Matrix.activeProcesses, function(child){
            child.send({ type: 'request-config' });
          });
          (_.isFunction(cb)) ? cb(): null;
          break;
        default:
          warn('No handler for channel:', msg.channel);
      }
    });
  });

  socket.on('close', function() {
    debug('socket close: ', socket.id);

    startSocketWatch();
  })

  socket.on('flush', function() {
    debug('socket flush', socket.id);
  })

  socket.on('upgrade', function(n) {
    debug('socket upgrade', socket.id);
  });

  socket.on('upgradeError', function(n) {
    error('socket upgrade error', socket.id);
  });

  socket.on('error', function(err) {
    error('socket error', err, err.stack)
  });
}

function closeSocket() {
  socket.close();
}

// Sends to Streaming Service 'app-emit'
function sendDataPoint(data) {
  debug('[M]->SS'.green, data);
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


function registerDevice() {
  if (!checkSocket()) {
    return;
  }
  socketEmit('device-register', {
    deviceId: Matrix.deviceId,
    user: Matrix.user
  });
}


function socketEmit(channel, payload) {
  debug('[M]->SS', channel, payload);
  socket.send(JSON.stringify({
    channel: channel,
    payload: payload
  }));
}
