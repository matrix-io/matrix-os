var url = require('url');
var socket;

var platform = require('os').platform();
var debug = debugLog('stream');

module.exports = {
  initSocket: initSocket,
  register: registerDevice,
  sendDataPoint: sendDataPoint,
  send: socketEmit,
  socket: socket,
  close: closeSocket,
  checkStreamingServer: checkStreamingServer,
  startWatcher: startSocketWatch,
  streamLog: streamLog,
  authError: streamError,
  registrationSuccessful: success,
  sendAppEvent: sendAppEvent
}

function success(){
  debug('Register Successful')
  Matrix.registerOK = true;
}

function streamError(data){
  console.error('Auth Error to MXSS', data);
  if ( data.name === 'TokenExpiredError'){
    Matrix.populateToken();
  }
  closeSocket();
}

function streamLog(data){
  socketEmit('app-log', data);
}

function startSocketWatch() {
  debug('Start Socket Watch');
  Matrix.config.socketCheckDelay = Math.round(Matrix.config.socketCheckDelay * 2 );
  debug('Socket Watch', Matrix.config.socketCheckDelay);
  _.delay( checkStreamingServer, Matrix.config.socketCheckDelay, stopSocketWatch);
}

function stopSocketWatch() {
  debug('Stop Socket Watch')

  Matrix.config.socketCheckDelay = 1000;
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
  Matrix.service.stream.initSocket(cb);
  /*
  var streamOptions = require('url').parse(Matrix.streamingServer);
  require('net').connect({
    port: streamOptions.port,
    host: streamOptions.hostname
  }, function(res) {
    debug('==== Streaming Server Visible === ', Matrix.streamingServer )
    // hit server, reset rolling delay
    Matrix.config.socketCheckDelay = 500;
    Matrix.service.stream.initSocket(cb);
  }).on('error', function() {
    error('No Streaming Server Visible', Matrix.streamingServer);

    Matrix.service.stream.startWatcher();


    if (_.isFunction(cb)) {
      cb();
    }
  });
  */
}

function checkSocket() {
  return true;
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
    return error('Device Token:'.grey, Matrix.deviceToken, '\nSocket requires Matrix.deviceToken. Remove db/service.db to force re-auth.'.red);
  }
  if (_.isUndefined(Matrix.deviceId)) {
    return error('Device ID:'.grey, Matrix.deviceToken, '\nSocket requires Matrix.deviceId. Remove db/service.db to force re-auth.'.red);
  }

  var sUrl = url.parse(Matrix.streamingServer);

  sUrl.protocol = 'wss';
  if (Matrix.env === 'hardcode'){
    sUrl.protocol = 'ws'
  }
  if ( Matrix.env === 'local'){
    // for local dev
    sUrl.protocol = 'http'
  }
  sUrl.pathname = 'engine.io';
  sUrl.query = {
    deviceToken: Matrix.deviceToken,
    deviceId: Matrix.deviceId
  };

  debug('Init Streaming Server:'.green, url.format(sUrl));
  // socket = require('engine.io-client')(url.format(sUrl));
  // Try to avoid making more then one of these.
  socket = require('engine.io-client')(url.format(sUrl), {
    transports: [ 'websocket', 'polling' ],
  });

  socket.on('open', function() {

    // continue init
    cb();

    socket.connected = true;

    // socket.removeAllListeners();
    debug('Socket Server Connected:'.blue, Matrix.streamingServer, socket.id);

    Matrix.socket = socket;

    socket.on('message', function(msg) {
      try {
        msg = JSON.parse(msg);
      } catch (e) {
        error(e);
      }

      debug('SS>', msg.channel, ':', msg.payload)

      // handled in event/server.js
      Matrix.events.emit(msg.channel, msg);

      // Messages recieved from the MXSS
      // switch (msg.channel) {
      //   case 'auth-ok':
      //     debug('Socket Server Auth:', msg);
      //     registerDevice();
      //     break;
      //   case 'auth-fail':
      //     error('Socket Authorization Fail', msg);
      //     socket.close();
      //     //kick off reauthorization
      //     debug('Matrix Reauthorizing...'.yellow)
      //     setTimeout( function() {
      //       Matrix.service.auth.authenticate();
      //     }, 10000)
      //     break;
      //   case 'cli-message':
      //     debug('ss->[M](cli-message)'.green, msg);
      //     // need to add socket for return msgs to CLI
      //     Matrix.events.emit('cli-message', msg);
      //     break;
      //   case 'trigger':
      //     debug('ss->[M](trigger).green', msg);
      //     Matrix.events.emit('trigger', msg);
      //     break;
      //   case 'register-ok':
      //     debug('Matrix registration ', 'OK'.green);
      //     // kickoff whatever else is waiting for init
      //     _.each(Matrix.activeApplications, function(child){
      //       if (child.type === 'app'){
      //         child.send({ type: 'request-config' });
      //       }
      //     });
      //     (_.isFunction(cb)) ? cb(): null;
      //     break;
      //   case 'cv-data':
      //     // sent back from VES service
      //     break;
      //   default:
      //     warn('No handler for channel:', msg.channel);
      // }
    });
  });

  socket.on('close', function() {
    debug('socket close: ', socket.id);
    Matrix.socket = null;
    socket.connected = false;
    startSocketWatch();
  });

  socket.on('flush', function() {
    // debug('socket flush', socket.id);
  });

  socket.on('upgrade', function(n) {
    debug('socket upgrade', socket.id );
  });

  socket.on('upgradeError', function(n) {
    error('socket upgrade error', socket.id );
  });

  socket.on('error', function(err) {
    error('socket error', err, err.stack)
  });
}

function closeSocket() {
  socket.close();
}

function sendDataPoint(data) {
  sendToSocket('app-emit', data);
}

function sendAppEvent(data) {
  sendToSocket('app-event', data);
}

// Sends to Streaming Service 'app-emit'
function sendToSocket(channel, data) {
  debug('[M]->SS'.green, channel.yellow, data);

  //TODO: Add validation

  // Unified Object
  var sendObj = {
    meta: {
      txId: Math.floor(Math.random()*16).toString(16),
      // todo: make dynamic
      apiVersion: '1.0'
    },
    results: [
      {
        meta: {
          timestamp: data.time || Date.now(),
          app: {
            name: data.appName,
            version: data.appVersion,
            platform: platform
          },
          device: {
            id: Matrix.deviceId
          },
        },
        data: data.data
      }
    ]
  };

  // ulog('U->SS Obj', sendObj);
  //TODO: Switch over to unified object
  if ( process.env['UNIFIED'] === true ){
    data = sendObj;
  }

  if (!checkSocket()) {
    // save data if the socket is down.

    //add device id for tracking
    Matrix.db.pending.insert({
      type: channel,
      payload: data
    });
    return;
  } else {
    // log('sent to infrastructure -- '.green, data);
    socketEmit(channel, data);
  }

  // Deliver pending data
  Matrix.db.pending.find({
    type: channel
  }, function(err, points) {
    if (err) console.error(err);
    // TODO: Group this stream into chunks of 10
    if (points.length > 0) {
      _.each(points, function(p) {
        socketEmit(channel, p.payload);
      });
    }
    // Once sent, remove
    Matrix.db.pending.remove({
      type: channel
    });
  });
}

// After device-auth, do device-register to handle data / events
function registerDevice() {
  debug('Auth OK')
  if (!checkSocket()) {
    return;
  }

  var fs = require('fs');

  // gather configurations to provide to SS
  var apps = _.filter(fs.readdirSync('./apps'), function(f){
    return ( f.indexOf('.matrix') > -1 )
  });

  var configs = [];

  _.each(apps, function(a){
    try {
      var config = require('js-yaml').safeLoad(
        fs.readFileSync('./apps/' + a + '/config.yaml')
      );
      configs.push(config);
    } catch (e){
      console.error(e);
    }
  });

  socketEmit('device-register', {
    deviceId: Matrix.deviceId,
    applicationConfigs: configs
  });
}


function socketEmit(channel, payload) {
  if (socket && socket.connected){
    debug('[M]->SS', channel, payload);
    socket.send(JSON.stringify({
      channel: channel,
      payload: payload
    }));
  }
}
