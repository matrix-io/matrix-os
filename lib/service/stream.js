var url = require('url');
var socket;

var platform = require('os').platform();
var debug = debugLog('stream');

//Flags
var refreshingToken = false;
var refreshTokenTimer;

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
  sendAppEvent: sendAppEvent,
  persistCache: persistCache,
};

function success() {
  debug('Register Successful');
  Matrix.registerOK = true;
}

function streamError(data) {
  console.error('Auth Error to MXSS', data);
  closeSocket();
  if (!_.isUndefined(data) && _.has(data, 'payload') && (data.payload === 'Invalid Device token' || _.has(data.payload, 'name') && data.payload.name === 'TokenExpiredError')) {

    //Reduce amount of concurrent refreshes using a timer
    if (!refreshingToken) {
      refreshingToken = true;
      
      refreshTokenTimer = setTimeout(function () {
        refreshingToken = false; //Allows more refreshes to be requested
      }, Matrix.config.socketRefreshTimeout * 1000);

      Matrix.service.token.populate(function (err) {
        if (err) console.log('Auth error:', err.message);
        refreshingToken = false;
        if (refreshTokenTimer) clearTimeout(refreshTokenTimer);
      });
    }
  }
}

function streamLog(data) {
  socketEmit('app-log', data);
}

function startSocketWatch() {
  debug('Start Socket Watch');
  Matrix.config.socketCheckDelay = Math.round(Matrix.config.socketCheckDelay * 2);
  debug('Socket Watch', Matrix.config.socketCheckDelay);
  _.delay(checkStreamingServer, Matrix.config.socketCheckDelay, stopSocketWatch);
}

function stopSocketWatch() {
  debug('Stop Socket Watch');

  Matrix.config.socketCheckDelay = 1000;
  clearTimeout(Matrix.socketWatcher);
}

function checkStreamingServer(cb) {
  if (_.isUndefined(cb)) cb = function () { };
  return Matrix.service.stream.initSocket(cb);

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

function checkSocket(cb) {

  if (_.isUndefined(socket)) error('Streaming Server Socket Not Initialized, trying again');
  else if (_.isNull(socket.id) || socket.connected === false) error('Streaming Server Not Connected');
  else if (socket.disconnected) error('Streaming Server Disconnected');
  else return cb(undefined, true);

  checkStreamingServer(function (err) { 
    return cb(err, err ? false : true);
  });
}

function initSocket(cb) {
  if (_.isUndefined(Matrix.deviceToken)) return error('Device Token:'.grey, Matrix.deviceToken, '\nSocket requires Matrix.deviceToken. Remove db/service.db to force re-auth.'.red);
  if (_.isUndefined(Matrix.deviceId)) return error('Device ID:'.grey, Matrix.deviceId, '\nSocket requires Matrix.deviceId. Remove db/service.db to force re-auth.'.red);

  var socketError;
  var callbackCalled = false;
  var sUrl = url.parse(Matrix.streamingServer);

  sUrl.protocol = 'wss';
  if (Matrix.env === 'hardcode') sUrl.protocol = 'ws';
  if (Matrix.env === 'local') sUrl.protocol = 'http'; // for local dev
  
  sUrl.pathname = 'engine.io';
  sUrl.query = {
    deviceToken: Matrix.deviceToken,
    deviceId: Matrix.deviceId
  };

  debug('Init Streaming Server:'.green, url.format(sUrl));
  // socket = require('engine.io-client')(url.format(sUrl));
  // Try to avoid making more then one of these.
  socket = require('engine.io-client')(url.format(sUrl), {
    transports: ['websocket', 'polling'],
  });

  socket.on('open', function() {
    debug('Socket Server Connected:'.blue, Matrix.streamingServer, socket.id);
    // socket.removeAllListeners();
    socket.connected = true;
    Matrix.socket = socket;

    if (!callbackCalled) {
      callbackCalled = true;
      cb(); // continue init
    }

    socket.on('message', function(msg) {
      try {
        msg = JSON.parse(msg);
      } catch (e) {
        error(e);
      }

      debug('SS>', msg.channel, ':', msg.payload);

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
    if (!callbackCalled) {
      callbackCalled = true;
      return cb(socketError); // continue init
    }
  });

  socket.on('flush', function() {
    // debug('socket flush', socket.id);
  });

  socket.on('upgrade', function(n) {
    debug('socket upgrade:', socket.id);
  });

  socket.on('upgradeError', function(n) {
    error('socket upgrade error:', socket.id);
  });

  socket.on('error', function (err) {
    socketError = err;
    error('socket error:', err.message);
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

function unifyObject(data) { 
  //TODO: Add validation
  var sendObj = {
    meta: {
      txId: Math.floor(Math.random() * 16).toString(16),
      // todo: make dynamic
      apiVersion: '1.0'
    },
    results: [{
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
    }]
  };

  return sendObj;
}

// Sends to Streaming Service 'app-emit'
function sendToSocket(channel, data) {
  debug('[M]->SS'.green, channel.yellow, data);

  //TODO add a cb?
  var cb = function () { }; //Fake cb
  
  //TODO: Switch over to unified object
  if (process.env.UNIFIED === true) data = unifyObject(data); // Unified Object

  // Save data and return if socket is down
  checkSocket(function (err, status) {
    if (err || !status) {
      Matrix.db.pending.insert({ //add device id for tracking
        type: channel,
        payload: data
      }, function (err) {
        return cb(err);
      });
    } else {
      
      var send = true;
      if (channel === 'app-emit') { // only throttle app data
        
        var d = Date.now();
        if (d - Matrix.lastWriteTime >= Matrix.rateLimit) { // has > n milliseconds elapsed from last write? if yes then it has been n number of seconds
          
          if (Matrix.sendCache.length !== 0) { // do we have a cache or not?
            data = _.map(Matrix.sendCache, 'payload'); // we have a cache, enough time has elapsed to write it, data = [ payloads ]
            Matrix.sendCache = [];
          }
          Matrix.lastWriteTime = d;
        } else { 
          send = false; // data is coming too quick! add to cache
          debug(d - Matrix.lastWriteTime, ' ms elapsed, added to streaming cache', Matrix.sendCache.length);
        }
      }

      if (send) socketEmit(channel, data); // Send data
      else Matrix.sendCache.push({ channel: channel, payload: data }); // Store in cache
    }
  });


  // Deliver other pending data
  // TODO: move to after register
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

// called onDestroy - saves cache in pending
function persistCache(cb){
  async.each(Matrix.sendCache,(d,cb) => {
    Matrix.db.pending.insert({
      type: d.channel,
      payload: d.payload
    }, cb);
  }, cb);
}

// After device-auth, do device-register to handle data / events
function registerDevice(opts) {
  debug('Auth OK');
  checkSocket(function (err, status) { 
    if (err || !status) return;

    if (_.has(opts, 'rateLimit')) Matrix.rateLimit = opts.rateLimit; // how many seconds between app emits, optimally
    
    var configs = [];
    var fs = require('fs');

    // gather configurations to provide to SS
    var apps = _.filter(fs.readdirSync(Matrix.config.path.apps), function (f) {
      return (f.indexOf('.matrix') > -1);
    });

    _.each(apps, function (a) {
      try {
        var config = require('js-yaml').safeLoad(
          fs.readFileSync(Matrix.config.path.apps + '/' + a + '/config.yaml')
        );
        configs.push(config);
      } catch (e) {
        console.error(e);
      }
    });

    socketEmit('device-register', {
      deviceId: Matrix.deviceId,
      //TODO: Now we're sending app configs on app start, depreciate
      applicationConfigs: true
    });
    
  });

}


function socketEmit(channel, payload) {
  
  if (socket && socket.connected) {
    debug('[M]->SS', channel, payload);
    socket.send(JSON.stringify({
      channel: channel,
      payload: payload
    }));
  }
}