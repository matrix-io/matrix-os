/**
 * Matrix.service.stream is concerned with establishing and maintaining a WebSocket connection to the Streaming Server (MXSS)
 * A progressive rolloff is implemented for connection timeouts. 
 * The connection is initialized after the device token is retrieved. @see index
 * Events coming from the WebSocket connection are relayed into the Matrix.events emitter
 */

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

/**
 * There was a problem connecting to the MXSS
 * @param {*} data 
 */
function streamError(data) {
  console.error('Auth Error to MXSS', data);
  closeSocket();
  if (
    !_.isUndefined(data) &&
    _.has(data, 'payload') && (
      data.payload === 'Invalid Device token' ||
      _.has(data.payload, 'name') &&
      data.payload.name === 'TokenExpiredError'
    )
  ) {

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

/* Used to distribute app logs to clients */
function streamLog(data) {
  socketEmit('app-log', data);
}

/**
 * First MXSS try failed, this is recursed until a connection is made
 * Connections are increasingly staggered, max 1 hour
 */
function startSocketWatch() {
  debug('Start Socket Watch');
  Matrix.config.socketCheckDelay = Math.min(1000*60*60, Math.round(Matrix.config.socketCheckDelay * 2));
  debug('Socket Watch', Matrix.config.socketCheckDelay);

  //TODO: validate that this works properly
  _.delay(checkStreamingServer, Matrix.config.socketCheckDelay, stopSocketWatch);
}

/**
 * we have made a successful connection, reset the socket reconnection logic
 */
function stopSocketWatch() {
  debug('Stop Socket Watch');

  Matrix.config.socketCheckDelay = 1000;
  clearTimeout(Matrix.socketWatcher);
}

/** 
 * self reference for easy coding, and versatility with callback handling
 */
function checkStreamingServer(cb) {
  if (_.isUndefined(cb)) cb = function () { };
  return Matrix.service.stream.initSocket(cb);
}

/** 
 * first step of MXSS connection is to determine socket state 
 */
function checkSocket(cb) {

  if (_.isUndefined(socket)) {
    error('Streaming Server Socket Not Initialized, trying again');
  }
  else if (_.isNull(socket.id) || socket.connected === false) {
    error('Streaming Server Not Connected');
  }
  else if (socket.disconnected) {
    error('Streaming Server Disconnected');
  }
  else {
    return cb(undefined, true);
  }

  checkStreamingServer(function (err) {
    return cb(err, err ? false : true);
  });
}

/**
 *  kick this beast off
 */
function initSocket(cb) {
  if (_.isUndefined(Matrix.deviceToken)) {
    return error('Device Token:'.grey, Matrix.deviceToken,
      '\nSocket requires Matrix.deviceToken. Remove db/service.db to force re-auth.'.red);
  }
  if (_.isUndefined(Matrix.deviceId)) {
    return error('Device ID:'.grey, Matrix.deviceId,
      '\nSocket requires Matrix.deviceId. Remove db/service.db to force re-auth.'.red);
  }

  var socketError;
  var callbackCalled = false;
  // populated from config/env or env vars
  var sUrl = url.parse(Matrix.streamingServer);

  sUrl.protocol = 'wss';
  if (Matrix.env === 'hardcode') sUrl.protocol = 'ws'; // ips generally don't use https
  if (Matrix.env === 'local') sUrl.protocol = 'http'; // for local dev

  sUrl.pathname = 'engine.io';
  sUrl.query = {
    deviceToken: Matrix.deviceToken,
    deviceId: Matrix.deviceId
  };

  debug('Init Streaming Server:'.green, url.format(sUrl));
  // socket = require('engine.io-client')(url.format(sUrl));
  // Try to avoid making more then one of these. Scoped to file.
  socket = require('engine.io-client')(url.format(sUrl), {
    transports: ['websocket', 'polling'],
  });

  // socket initialization, this is called once
  socket.on('open', function () {
    debug('Socket Server Connected:'.blue, Matrix.streamingServer, socket.id);
    // socket.removeAllListeners();
    socket.connected = true;
    Matrix.socket = socket;

    if (!callbackCalled) {
      callbackCalled = true;
      cb(); // continue init
    }

    // socket message, this is called many many times
    socket.on('message', function (msg) {
      try {
        msg = JSON.parse(msg);
      } catch (e) {
        error(e);
      }

      debug('SS>[M]', msg.channel, ':', msg.payload);

      // handled in event/server.js
      // TODO: filter message, only pass valid channels
      Matrix.events.emit(msg.channel, msg);

    });
  });

  /**
   * for whatever reason, the socket closes. this is how we handle it.
   */
  socket.on('close', function () {
    debug('socket close: ', socket.id);
    Matrix.socket = null;
    socket.connected = false;
    startSocketWatch();
    if (!callbackCalled) {
      callbackCalled = true;
      return cb(socketError); // continue init
    }
  });

  socket.on('flush', function () {
    // debug('socket flush', socket.id);
  });

  socket.on('upgrade', function (n) {
    debug('socket upgrade:', socket.id);
  });

  socket.on('upgradeError', function (n) {
    error('socket upgrade error:', socket.id);
  });

  socket.on('error', function (err) {
    error('socket error:', err.message);
  });
}

function closeSocket() {
  socket.close();
}

/** majority of the traffic is this one  */
function sendDataPoint(data) {
  sendToSocket('app-emit', data);
}

/** cross talk */
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

  //TODO add a cb? this should be part of the ack logic
  var cb = function () { }; //Fake cb

  //TODO: Switch over to unified object. 10-15-17 is this still happening? -sc
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

      // Deliver other pending data
      // TODO: copy to after register
      Matrix.db.pending.find({
        type: channel
      }, { _id: 0 }, function (err, points) {
        if (err) console.error(err);

        if (points.length > 0) {
          _.each(points, function (p) {
            // strip id
            p.payload = _.omit(p.payload, '_id');
            Matrix.sendCache.push({ channel: channel, payload: p.payload })
          });
        }
        // Once sent, remove
        Matrix.db.pending.remove({
          type: channel
        });
      });

      // THROTTLE DATA POINTS
      if (channel === 'app-emit') {
         // only throttle app data

        var d = Date.now();
        
        if (d - Matrix.lastWriteTime >= Matrix.rateLimit) { 
          // has > n milliseconds elapsed from last write? if yes then it has been n number of seconds

          debug('not too fast');
          if (Matrix.sendCache.length > 0) { 
            // do we have a cache or not?
            debug('[M]->SS cache rollup >>>');
            data = _.map(Matrix.sendCache, 'payload'); 
            // we have a cache, enough time has elapsed to write it, data = [ payload, payload... ]
            Matrix.sendCache = [];
          }

          //reset the timer for last write, as we're going to write in the next step
          Matrix.lastWriteTime = d;

        } else {

          send = false; // data is coming too quick! add to cache
          debug('too fast', d - Matrix.lastWriteTime, ' ms elapsed write to streaming cache. rec#', Matrix.sendCache.length);
        }
      }

      // strip id from any nedb
      data = _.omit(data, '_id');

      if (send) {
        // Send data
        debug('[M]->SS'.green, channel.yellow, data);
        socketEmit(channel, data);
      } else {
        // Store in cache
        debug('[M]->cache'.green);
        Matrix.sendCache.push({ channel: channel, payload: data });
        //
      }

    }
  });
}

// timeout to send cache, setup on stream load, 
// makes sure we write every 15 seconds no matter what
var writeSendCacheInterval = setInterval(function () {
  if (Matrix.sendCache.length > 0) { 
    // do we have a cache or not?
    debug('[M]->SS write stale send cache #', Matrix.sendCache.length);
    // we have a cache, enough time has elapsed to write it, data = [ payloads ]
    var data = _.map(Matrix.sendCache, 'payload'); 
    // only app-emits are cached, this will send as [], triggers bulk mode
    socketEmit('app-emit', data);
    Matrix.sendCache = [];
  }
}, 15 * 1000)

// called onDestroy - saves cache in pending
function persistCache(cb) {
  async.each(Matrix.sendCache, (d, cb) => {
    Matrix.db.pending.insert({
      type: d.channel,
      payload: d.payload
    }, cb);
  }, cb);
}

// After device-auth, do device-register to handle data / events
function registerDevice(opts) {
  debug('Auth OK. Registering...'.yellow);

  // make sure we havn't been kicked off during auth
  checkSocket(function (err, status) {
    if (err || !status) return;

    // how many seconds between app emits, optimally
    // TODO: make MXSS support sending this
    if (_.has(opts, 'rateLimit')) {
      Matrix.rateLimit = opts.rateLimit;
    }

    socketEmit('device-register', {
      deviceId: Matrix.deviceId,
      //TODO: Now we're sending configs on app start, depreciate this
      applicationConfigs: true
    });

  });

}


/**
 * pretty damn important for being at the end of the file
 * writes to the socket using a standardized format 
 * @example { channel: 'app-emit', payload: {foo: 'bar'}}
 */
function socketEmit(channel, payload) {

  if (socket && socket.connected) {
    debug('[M]->SS', channel, payload);
    socket.send(JSON.stringify({
      channel: channel,
      payload: payload
    }));
  }
}