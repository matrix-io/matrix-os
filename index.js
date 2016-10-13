// Welcome to MatrixOS - A JavaScript environment for IoT Applications
forceExit = false;
/* GLOBALS */
_ = require('lodash');
async = require('async');

require('colors');

// Logging Utilities
ulog = function(){
  _.each(arguments, function(a){
    console.log(require('util').inspect(a, {depth:null, colors:true}))
  })
};

warn = console.log;
log = console.log;
error = console.error;

// based on NODE_ENV, set sensible defaults
var envSettings = getEnvSettings();
// if NODE_ENV=dev then set sane debug
if ( envSettings.debug === true && !_.has(process.env, 'DEBUG' ) ){
  process.env.DEBUG = '*,-engine*,-Component*';
  // process.env.DEBUG = '*,-engine*';
}

debugLog = require('debug');
var debug = debugLog('matrix');

// Core Library - Creates Matrix.device, Matrix.event, Matrix.service
Matrix = require('./lib/index.js');

// runtime reference for device components, led, gyro, etc
Matrix.components = {};

// Make globals from env settings for easy access
parseEnvSettings(envSettings);

// Configuration besides env settings
Matrix.config = require('./config');

debug('Debug:', process.env.DEBUG);
debug('====== config ===vvv'.yellow)
debug( Matrix.config, '\n');

// Check that servers and device Id exists.
var reqKeys = ['deviceId', 'apiServer', 'streamingServer'];
var foundKeys = _.intersection(_.keysIn(Matrix), reqKeys);
if ( foundKeys.length < reqKeys.length ){
  var missingKeys = _.xor(reqKeys, foundKeys);
  _.each(missingKeys, function (k) {
    console.error('Matrix Registration Requires %s'.red, _.kebabCase(k).yellow);
  })
  process.exit(1);
}

debug('','ENV:'.grey, Matrix.env.blue , 'API:'.grey, Matrix.apiServer.blue, 'MXSS:'.grey, Matrix.streamingServer.blue)

var events = require('events');

//Event Loop - Handles all events. Not to be confused with Matrix.event
Matrix.events = new events.EventEmitter();
// seems like a fair number for now, should cap at 10 apps running
Matrix.events.setMaxListeners(50);
Matrix.events.on('addListener', function(name) {
  debug('+ Event Listener', name);
})

//Initialize Libraries. Calls module.export.init() if exists.
Matrix.event.init();
Matrix.service.init();
Matrix.device.init();

// start loading LED animation
Matrix.device.drivers.led.loader();

// Node-SDK - Use for API Server Communication
// SDK is used mainly for AUTH
Matrix.api = require('matrix-node-sdk');
Matrix.api.makeUrls(Matrix.apiServer);

//app process objects, see lib/service/mananger
Matrix.activeApplications = [];
//active sensors, see lib/device/sensor
Matrix.activeSensors = [];
//active detections, see lib/device/detection
Matrix.activeDetections = [];

//db - files stored in db/
var DataStore = require('nedb');
Matrix.db = {
  // used to save useful device state info
  service: new DataStore({
    filename: Matrix.config.path.db.service,
    autoload: true
  }),
  // used to store unsent data
  pending: new DataStore({
    filename: Matrix.config.path.db.pending,
    autoload: true
  })
}

Matrix.device.malos.info(function(data){
  console.log("DEVICE", data);
})

var jwt = require('jsonwebtoken');

var msg = [];

  // init
  async.series([

    function checkApiServer(cb) {
      debug('Checking API server...'.green);
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

        if (!_.has(decoded, 'claims') || !_.has(decoded.claims, 'deviceToken') ||
            decoded.claims.deviceToken !== true) {
          return cb('Bad device token');
        }

        if ( decoded.claims.device.id !== Matrix.deviceId ) {
          return cb('Device Token Device Id does not match deviceId');
        }

        Matrix.deviceToken = token;
        Matrix.deviceRecordId = decoded.claims.device.key;
        Matrix.userId = decoded.uid;

        debug('processDeviceToken - Matrix.userId>'.green, Matrix.userId);
        debug('processDeviceToken - Matrix.deviceRecordId>'.green, Matrix.deviceRecordId);
        cb();
      });
    },
    function(cb){
      debug('Checking MXSS...'.green);
      if ( !process.env.hasOwnProperty('MATRIX_NOMXSS') ){
        Matrix.service.stream.initSocket(cb);
      } else {
        cb()
      }
    },
    function firebaseInit(cb) {
      debug('Starting Firebase...'.green + ' U:', Matrix.userId, ', D: ', Matrix.deviceId, ', DT: ' , Matrix.deviceToken);
      Matrix.service.firebase.init(Matrix.userId, Matrix.deviceId, Matrix.deviceToken, Matrix.env, function (err, deviceId) {
        if (!err) {
          Matrix.service.firebase.initialized = true;
        }
        cb(err, deviceId);
      });
    },
    function setupFirebaseListeners(cb) {
      debug('Setting up Firebase Listeners...'.green);
      // watch for app installs
      // first pass is gets all apps

      Matrix.service.firebase.app.getUserAppIds(function (appIds) {
        if (!_.isUndefined(appIds)) {
          appIds = {};
        }
        console.log('Installed Apps:'.green, _.map( appIds, 'name' ).join(', ').grey)

        // for deviceapps installs. idk if this is useful yet.
        // Matrix.service.firebase.deviceapps.getInstalls( function(apps){
        //   debug('device apps records', _.keys(apps));
        // })

        var appsDir = fs.readdirSync('apps');
        var appFolders = _.filter(appsDir, function(a){
          return ( a.indexOf('.matrix') > -1 )
        });

        console.log('Local Apps:', appFolders);

        var fileSystemVariance = appFolders.length - _.map( appIds, 'name' ).length;

        console.log('Local / Installed Δ', fileSystemVariance  )

        if ( fileSystemVariance === 0 ){
          debug('Invariance. Clean System. Matching Records')
        } else {
          debug('Variance detected between registered applications and applications on device.')

          // sync new installs to device
          // find apps which aren't on the device yet
          var newApps = _.pickBy( appIds, function(a){
            return ( appFolders.indexOf(a.name + '.matrix') === -1 )
          })

          _.forIn(newApps, function(a, id){
            Matrix.service.firebase.appstore.get( id, function(appRecord){

              // for version id in firebase 1_0_0
              var vStr = _.snakeCase( a.version || '1.0.0');
              var vId = id + '-' + vStr;

              var url = appRecord.versions[vId].file;

              // filter out test appstore records
              if ( url.indexOf('...') === -1 ){
                console.log('=== Offline Installation === ['.yellow, a.name.toUpperCase(), ']'.yellow, a.version.grey, a.id.grey)

                Matrix.service.manager.install({
                  name: a.name,
                  version: a.version || '1.0.0',
                  url: url,
                  id: id
                }, function(err){
                  cb(err);
                });
              }
            })
          })

        }

        //App uninstalls
        Matrix.service.firebase.app.watchUserAppsRemoval(function (app) {
          debug('Firebase->UserApps->(X)', app.id, ' (' + app.name + ')');
          // app to uninstall!
          // refresh app ids in case of recent install
          Matrix.service.firebase.app.getUserAppIds( function (appIds) {
            if (_.keys(appIds).indexOf(app.id) !== -1) {
              console.log('uninstalling ', app.name + '...');
              Matrix.service.manager.uninstall(app.name, function(err){
                if (err) return error(err);
                console.log('Successfully uninstalled ' + app.name.green);
              })
            } else {
              console.log('The application ' + app.name + ' isn\'t currently installed on this device');
            }
          })
        });

        //App installations
        Matrix.service.firebase.user.watchForNewApps( Matrix.deviceId, function( apps ){
          debug('Firebase->UserApps->(new)', apps )
          var newAppId;
          // look at updated at timestamps to determine if new
          // not using versions because it doesn't support deploy
          var localVersions = appIds;
          var remoteVersions = apps;
          debug('localVersions', localVersions);
          debug('remoteVersions', remoteVersions);
          debug('Found ' + Object.keys(remoteVersions).length + ' remote apps');
          // find the app id of the changed app
          for (var appId in remoteVersions) {
            if (!localVersions.hasOwnProperty(appId)) {
              //If app isn't in local apps, need to install it
              newAppId = appId;
              break;
            } else if (remoteVersions[appId].hasOwnProperty('updatedAt')) {
              // No updatedAt date
              if ( !localVersions[appId].hasOwnProperty('updatedAt') ||
                    localVersions[appId].updatedAt !== remoteVersions[appId].updatedAt )
              {
                // Remote version is different, update
                newAppId = appId;
                break;
              } else {
                debug('Already updated ' + remoteVersions[appId].name.yellow);
              }
            } else {
              debug('Not installing ' + remoteVersions[appId].name.yellow);
            }
          };

          if ( !_.isUndefined(newAppId) ){
            // if there is a new / updated app, newAppId will be defined

            //Merge appIds for future use
            appIds[newAppId] = apps[newAppId];

            console.log('installing', newAppId);
            Matrix.service.firebase.deviceapps.get(newAppId, function (app) {
              debug('App data: ', app);
              var appName = app.meta.shortName || app.meta.name;
              var installOptions = {
                url: app.meta.file || app.file, //TODO only use meta
                name: appName,
                version: app.meta.version || app.version, //TODO only use meta
                id: newAppId
              }

              debug('Trying to install: ' + appName.yellow);
              Matrix.service.manager.install(installOptions, function (err) {
                debug('Finished index install');
                cb(err);
                console.log(appName, installOptions.version, 'installed from', installOptions.url);
              })
            })
          } else {
            cb();
          }
        });
      })

    },

    function checkFirebaseInfo(cb) {
      debug('Checking Firebase Info...'.green);
      Matrix.service.firebase.device.get( function(err, device){
        if(err  || _.isNull(device) ) return cb('Bad Device Record');
        debug('[fb]devices/>'.blue, device)
        Matrix.service.firebase.user.checkDevice( Matrix.deviceId, function (err, device) {
          if (err || _.isNull(device) ) return cb('Bad User Device Record');
          debug('[fb]user/devices/deviceId>'.blue, device);
          cb();
        })
      });
    },

    //TODO: implement MOS update system
    function checkUpdates(cb) {
      var info = JSON.parse(require('fs').readFileSync('package.json'));
      var currentVersion = info.version;
      require('https').get(
        'https://raw.githubusercontent.com/matrix-io/matrix-os/master/package.json'
      , function(res){
        // console.log(res);
        var write = "";
        res.on('data', function(c){
          write += c;
        })
        res.on('end', function(e){
          var remoteVersion = JSON.parse(write).version;
          if ( currentVersion === remoteVersion ){
            debug('Latest Version Installed. ' + currentVersion.grey)
            cb()
          } else {
            msg.push('MATRIX OS Upgrade Ready. ' + remoteVersion + ' now available.')
            cb();
          }
        })
      })
    },
  ], function(err) {
    if (err) {
      debug('Initialization error! '.red, err);
      // Matrix.device.drivers.led.error();
      //TODO Connectivity error needs to be handled gracefully
      // Sample error message in err = 'matrix A network error (such as timeout, interrupted connection or unreachable host) has occurred.'
      Matrix.haltTheMatrix();
      return error('Bad Matrix Initialization', err);
    }

    Matrix.service.firebase.device.goOnline();
    Matrix.service.firebase.device.ping();

    Matrix.device.drivers.led.stopLoader();
    Matrix.device.drivers.led.clear();
    // debug('vvv MATRIX vvv \n'.yellow,
    // require('util').inspect( _.omit(Matrix, ['device','password','username','events','service','db']), { depth : 0} ), "\n^^^ MATRIX ^^^ ".yellow);
    if (err) { error(err); }
    if ( Matrix.registerOK ){
      log('MXSS Connected:'.green, Matrix.streamingServer.grey)
    }
    log( Matrix.is.green.bold, '['.grey + Matrix.deviceId.grey + ']'.grey, 'ready'.yellow.bold);
    Matrix.banner();
    if (msg.length > 0){
      console.log(msg.join('\n').red);
    }

    //if START_APP is set
    if (Matrix.config.fakeApp) {
      Matrix.service.manager.start(Matrix.config.fakeApp);
    }

    //for tests
    Matrix.events.emit('matrix-ready');

    if (process.env.hasOwnProperty('REPL')){
      const repl = require('repl');
      repl.start('> ').context.Matrix = Matrix;
    }

    Matrix.service.lifecycle.updateLastBootTime();
  });


module.exports = {
  Matrix: Matrix
}

/*
███    ███  █████  ████████ ██████  ██ ██   ██
████  ████ ██   ██    ██    ██   ██ ██  ██ ██
██ ████ ██ ███████    ██    ██████  ██   ███
██  ██  ██ ██   ██    ██    ██   ██ ██  ██ ██
██      ██ ██   ██    ██    ██   ██ ██ ██   ██
*/



// Process Level Event Listeners

//Triggered when the application is killed by a [CRTL+C] from keyboard
process.on("SIGINT", function() {
  log("Matrix -- CRTL+C kill detected");
  disconnectFirebase(function () {
    process.exit(0);
  });
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
  onDestroy();
}

/*
@method onDestroy
@description Stop process before stop application
*/
function onDestroy() {
  //TODO: Implemenent cleanups
  // kill children apps\
  debug("DESTROYING".red);
  if (!forceExit) {
    disconnectFirebase(function () {
      async.series([
        Matrix.service.manager.killAllApps,
        Matrix.service.manager.clearAppList,
        Matrix.service.manager.cleanLogs,
        // Matrix.device.drivers.clear
      ], function (err) {
        if (err) error(err);
        console.log('Cleanup complete...');
        process.exit(0);
      });
    });
  } else {
    console.log('Unable to clean, exitting...');
    process.exit(1);
  }

}

/*
@method onDestroy
@description If Firebase was initialized, pings firebase and sends a goes offline, skips otherwise
*/
function disconnectFirebase(cb) {
  if (!_.isUndefined(Matrix.service.firebase.initialized) && Matrix.service.firebase.initialized) {
    debug('Disconnecting firebase');
    Matrix.service.firebase.device.ping();
    Matrix.service.firebase.device.goOffline(cb);
  } else {
    debug('Firebase wasn\'t initialized');
    cb();
  }
}

// every 4 hours do this
setInterval(function maintenance() {
  Matrix.service.manager.cleanLogs();
}, 1000 * 60 * 60 * 4);

//Triggered when an unexpected (programming) error occurs
//Also called when a DNS error is presented
process.on('uncaughtException', function(err) {
  console.error('Uncaught exception: ', err, err.stack);
  if (err.code && err.code == "ENOTFOUND") {
    error('ENOTFOUND (Connectivity error)');
    //TODO Attempt to restablish connectivity? Matrix.device.manager.setupDNS();
  } else if (err.code && err.code == "EAFNOSUPPORT") {
    error('EAFNOSUPPORT (Connectivity error)');
    //TODO Attempt to restablish connectivity? Matrix.device.manager.setupDNS();
  } else if (err.code && err.code == "ETIMEDOUT") {
    error('ETIMEDOUT (Connectivity error)');
    //TODO Attempt to restablish connectivity? Matrix.device.manager.setupDNS();
  } else if (err.code && err.code == "ENOMEM") {
    error('ENOMEM was detected (Out of memory)');
    // error(err.stack);
    Matrix.device.manager.reboot("Memory clean up");
  } else {
    forceExit = true;
    console.error("UNKNOWN ERROR!".red, err.stack);

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
  // Change to production after leaving alpha
  var environmentSetting = env || process.env['NODE_ENV'] || 'rc';
  var validEnvList = require('fs').readdirSync('./config/env');

  if ( _.intersection(environmentSetting, validEnvList).length > -1 ){
    console.log('Environment Selected:'.grey, environmentSetting.blue);
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
