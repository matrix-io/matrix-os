/* GLOBALS */
_ = require('lodash');
async = require('async');


ulog = function(){
  _.each(arguments, function(a){
    console.log(require('util').inspect(a, {depth:null, colors:true}))
  })
};

warn = console.log;
log = console.log;
error = console.error;

Matrix = {};

// setup debug before lib loading
var envSettings = getEnvSettings();
if ( envSettings.debug === true && _.isUndefined(process.env['DEBUG'])){
  process.env['DEBUG'] = '*,-engine*'
}
// for debug messages
debugLog = require('debug');
var debug = debugLog('matrix');

// Core
Matrix = require('./lib');

// populate keys from settings after requiring libs
parseEnvSettings(envSettings);


// Config - Envs are handled here
Matrix.config = require('./config');
// debug('Envs:', Matrix.config.envs);
debug('Debug:', process.env['DEBUG']);

debug('====== config ===vvv'.yellow)
debug( _.omit(Matrix.config, ['envs', 'username','password']) , '\n');

var reqKeys = ['deviceId', 'apiServer', 'streamingServer'];
var foundKeys = _.intersection(_.keysIn(Matrix), reqKeys);
if ( foundKeys.length < reqKeys.length ){
  var missingKeys = _.xor(reqKeys, foundKeys);
  _.each(missingKeys, function (k) {
    console.error('Matrix Registration Requires %s'.red, _.kebabCase(k).yellow);
  })
  process.exit(1);
}

log('ENV:'.grey, Matrix.env.blue , 'API:'.grey, Matrix.apiServer.blue, 'MXSS:'.grey, Matrix.streamingServer.blue)

var fs = require('fs');
var events = require('events');
var util = require('util');


//Event Loop - Handles all events
Matrix.events = new events.EventEmitter();
// seems like a fair number
Matrix.events.setMaxListeners(50);
Matrix.events.on('addListener', function(name) {
  log(name);
})

//Initialize Listeners - Code goes here
Matrix.event.init();

//@TODO where is this this defined ??
Matrix.service.init();
Matrix.device.init();

// Node-SDK - Use for API Server Communication
// SDK
Matrix.api = require('matrix-node-sdk');
Matrix.api.makeUrls(Matrix.apiServer);

//app processes, see lib/service/mananger
Matrix.activeApplications = [];
Matrix.activeSensors = [];

//db - files stored in db
var DataStore = require('nedb');
Matrix.db = {
  config: new DataStore({
    filename: Matrix.config.path.db.config,
    autoload: true
  }),
  device: new DataStore({
    filename: Matrix.config.path.db.device,
    autoload: true
  }),
  user: new DataStore({
    filename: Matrix.config.path.db.user,
    autoload: true
  }),
  service: new DataStore({
    filename: Matrix.config.path.db.service,
    autoload: true
  }),
  pending: new DataStore({
    filename: Matrix.config.path.db.pending,
    autoload: true
  })
}
var jwt = require('jsonwebtoken');

  // this is kind of an init flow
  async.series([

    function checkApiServer(cb) {
      Matrix.device.led.loader();
      require('http').get(Matrix.apiServer, function(res) {
        cb(null);
      }).on('error', function() {
        error('No API Server Visible', Matrix.apiServer);
        cb();
      });
    },
    function populateToken(cb) {
      // Fetches device token from service and stores to local DB

      Matrix.service.auth.authenticate(function setupDeviceToken(err, token) {
        if (err) return cb(err);

        debug('PopulateToken - OK>'.green, token);

        var decoded = jwt.decode(token);
        debug('PopulateToken - decoded>'.yellow, decoded);

        if ( decoded.d.did !== Matrix.deviceId ) {
          cb('Device Token Device Id does not match deviceId');
        }

        Matrix.deviceToken = token;
        Matrix.deviceRecordId = decoded.d.dkey;
        Matrix.userId = decoded.d.uid;
        debug('processDeviceToken - Matrix.userId>'.green, Matrix.userId);
        debug('processDeviceToken - Matrix.deviceRecordId>'.green, Matrix.deviceRecordId);
        // Where do we do this ??
        /**
        Matrix.db.service.update(
          {deviceId: deviceRecordId},
          {
            deviceToken: token
            ...
          });
        **/
        Matrix.service.firebase.init(Matrix.userId, Matrix.deviceId, Matrix.deviceToken, cb);
      });
    },
    function checkUpdates(cb) {
      return cb();
      // warn('Updates not implemented on api yet');
      // Matrix.api.device.checkUpdates(function(err, update) {
      //   if (err) return cb(err);
      //   // check version
      //   if (update.version === Matrix.version) {
      //     cb(null);
      //   } else {
      //     cb(null);
      //   }
      // });
    },
    function(cb){
      debug('Checking MXSS');
      Matrix.service.stream.checkStreamingServer(),
      cb()
    },
  ], function(err) {
    Matrix.device.led.stopLoader();
    Matrix.device.led.clear();
    debug('vvv MATRIX vvv \n'.yellow,
    require('util').inspect( _.omit(Matrix, ['device','password','username','events','service','db']), { depth : 0} ), "\n^^^ MATRIX ^^^ ".yellow);
    if (err) { error(err); }
    log(Matrix.is.green.bold, '['.grey + Matrix.deviceId.grey + ']'.grey, 'ready'.yellow.bold);
    Matrix.banner();

    //if START_APP is set
    if (Matrix.config.fakeApp) {
      Matrix.service.manager.start(Matrix.config.fakeApp);
    }

    //for tests
    Matrix.events.emit('matrix-ready');
  });

  /*
  ███    ███  █████  ████████ ██████  ██ ██   ██
  ████  ████ ██   ██    ██    ██   ██ ██  ██ ██
  ██ ████ ██ ███████    ██    ██████  ██   ███
  ██  ██  ██ ██   ██    ██    ██   ██ ██  ██ ██
  ██      ██ ██   ██    ██    ██   ██ ██ ██   ██
  */



Matrix.service.lifecycle.updateLastBootTime();

module.exports = {
  Matrix: Matrix
}

// Process Level Event Listeners

//Triggered when the application is killed by a [CRTL+C] from keyboard
process.on("SIGINT", function() {
  log("Matrix -- CRTL+C kill detected");
  process.exit(0);
});

//Triggered when the application is killed with a -15
process.on("SIGTERM", function() {
  log("Matrix -- Kill detected");
  onKill();
});

//Triggered when the application is killed by a [CRTL+\] from keyboard
process.on("SIGQUIT", function() {
  log("Matrix -- CRTL+\\ kill detected");
  onKill();
});


/*
@method onKill
@description Used to unify the behavior of all kill signals
*/
function onKill() {
  log("Matrix -- Application Closing...");
  // Matrix.service.stream.close();
  onDestroy();
}

/*
@method onDestroy
@description Stop process before stop application
*/
function onDestroy() {
  //TODO: Implemenent cleanups
  // kill children apps
  async.series([
    Matrix.service.manager.killAllApps,
    Matrix.service.manager.clearAppList,
    Matrix.service.manager.cleanLogs,
    // Matrix.device.led.clear
  ], function(err){
    if (err) error(err);
    console.log('Cleanup complete...');
    process.exit(0);
  });
}

// every 4 hours do this
setInterval(function maintenance() {
  Matrix.service.manager.cleanLogs();
}, 1000 * 60 * 60 * 4);

//Triggered when an unexpected (programming) error occurs
//Also called when a DNS error is presented
process.on('uncaughtException', function(err) {
  console.error('Matrix -- Uncaught exception: ', err, err.stack);
  if (err.code && err.code == "ENOTFOUND") {
    error('Matrix -- ENOTFOUND was detected (DNS error)');
    Matrix.device.manager.setupDNS();
  } else if (err.code && err.code == "EAFNOSUPPORT") {
    error('Matrix -- EAFNOSUPPORT was detected (DNS error 2?)');
    Matrix.device.manager.setupDNS();
  } else if (err.code && err.code == "ETIMEDOUT") {
    error('Matrix -- ETIMEDOUT was detected (DNS error 3?)');
    Matrix.device.manager.setupDNS();
  } else if (err.code && err.code == "ENOMEM") {
    error('Matrix -- ENOMEM was detected (Out of memory)');
    // error(err.stack);
    Matrix.device.manager.reboot("Memory clean up");
  } else {
    // error(err.stack);

    // TODO: bad update? revert to last
    //revert old
    // getOldBranch(function (oldBranch) {
    //   if (oldBranch && oldBranch !== "") {
    //     revertUpdate(function (error) {
    //       if (error) {
    //         warn("Boot -- Error reverting...");
    //         onDestroy();
    //       }
    //     });
    //   } else {
    //     onDestroy();
    //   }
    // });
    onDestroy();
  }
});


// UTILITY
function getEnvSettings(env){
  var environmentSetting = env || process.env['NODE_ENV'] || 'production';
  var validEnvList = require('fs').readdirSync('./config/env');

  if ( _.intersection(environmentSetting, validEnvList).length > -1 ){
    return require('./config/env/'+ environmentSetting + '.js');
  }

}

function parseEnvSettings(envSettings){
  Matrix.deviceId = envSettings.deviceId;
  Matrix.deviceSecret = envSettings.deviceSecret;
  if ( _.has(envSettings, 'url') ) {
    Matrix.streamingServer = envSettings.url.streaming;
    Matrix.apiServer = envSettings.url.api;
    Matrix.env = envSettings.name;
  } else {
    console.error('There is a problem with ENV', Matrix.env);
  }
}

Matrix.haltTheMatrix = function(){
  onDestroy();
}
