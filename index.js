// Welcome to MatrixOS - A JavaScript environment for IoT Applications

// for crash handling

var forceExit = false;
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
  process.env.DEBUG = '*,-engine*,-Component*,-*led*';
  // process.env.DEBUG = '*,-engine*';
}

debugLog = require('debug');
var debug = debugLog('matrix');

// Core Library - Creates Matrix.device, Matrix.event, Matrix.service
Matrix = require('./lib/index.js');

// runtime reference for device components, led, gyro, etc
Matrix.components = {};
//app process objects, see lib/service/mananger
Matrix.activeApplications = [];
//active sensors, see lib/device/sensor
Matrix.activeSensors = [];
//active detections, see lib/device/detection
Matrix.activeServices = [];
// a collection of apps installed on the device, not expecially in firebase
Matrix.localApps = {};

// Make Matrix[setting] from env settings for easy access
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
// This needs to be done after urls are made available via parseEnvSettings
Matrix.api.makeUrls(Matrix.apiServer);


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

// Show whats available from MALOS
Matrix.device.malos.info(function(data){
  var out = '';
  _.each(data.info, function(i){
    out += ' ⚙ '.yellow + i.driver_name.blue + ':' + i.base_port + ' | ' + i.notes_for_human.grey + '\n';
  })
  debug('MALOS COMPONENTS', '\n', out);
})

var jwt = require('jsonwebtoken');

var msg = [];

  // init
  async.series([

    // Make sure we can see the API server for auth
    function checkApiServer(cb) {
      debug('Checking API server...'.green);
      require('http').get(Matrix.apiServer, function(res) {
        cb(null);
      }).on('error', function() {
        error('No API Server Visible', Matrix.apiServer);
        cb();
      });
    },

    // Check for updates to MOS and dependencies
    function checkUpdates(cb) {

      // in case you want to skip the upgrade for whatever reason
      if (  process.env.hasOwnProperty('NO_UPGRADE') ){
        cb();
        return;
      }

      // check depends - eventfilter is used for apps
      var deps = [ Matrix.service.firebase, Matrix.api, require('matrix-app-config-helper'), require('matrix-eventfilter')];

      var olds = _.filter(deps, { current : false });

      if ( olds.length > 0 ){
        console.log('Upgrading Dependencies....'.yellow)
        require('child_process').execSync('npm upgrade matrix-node-sdk matrix-app-config-helper matrix-firebase matrix-eventfilter');
        console.log('Upgrade Done!'.green, 'Please restart MATRIX OS.');
        process.exit();
      } else {
        console.log('Dependencies up to date.')
      }

      // check MATRIX OS
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
        res.on('end', function(){
          var remoteVersion = JSON.parse(write).version;
          if ( currentVersion === remoteVersion ){
            debug('Latest Version Installed. ' + currentVersion.grey)
            cb()
          } else {
            console.log('MATRIX OS Upgrade Ready. ' + remoteVersion + ' now available.\n', 'Upgrading MATRIX OS....')
            require('child_process').execSync('git submodule update --init;git fetch;git pull');
            console.log('Upgrade Complete: Restart MATRIX OS... ')
            process.exit();
            cb();
          }
        })
      }).on('error', function (e) {
        console.error('Upgrade Check Error: ', e)
      })
    },


    function populateToken(cb) {

      // Fetches device token from service and saves to local DB
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
    function mxssInit(cb){

      // Now that we have a token, lets login to the streaming server
      debug('Checking MXSS...'.green);
      // extremely unlikely event that the mxss is bad and we need to skip
      if ( !process.env.hasOwnProperty('MATRIX_NOMXSS') ){
        Matrix.service.stream.initSocket(cb);
      } else {
        cb()
      }
    },
    // token also lets us access firebase
    function firebaseInit(cb) {
      debug('Starting Firebase...'.green + ' U:', Matrix.userId, ', D: ', Matrix.deviceId, ', DT: ' , Matrix.deviceToken);
      Matrix.service.firebase.init(Matrix.userId, Matrix.deviceId, Matrix.deviceToken, Matrix.env, function (err, deviceId) {
        if (!err) {
          Matrix.service.firebase.initialized = true;
        }
        if ( deviceId !== Matrix.deviceId ){
          return cb('firebase / deviceid mismatch')
        }
        cb(err, deviceId);
      });
    },
    function syncApps(cb) {
      // Gets all apps

        // this is populated from init>getallapps
        Matrix.localApps = Matrix.service.firebase.util.records.apps || Matrix.localApps;
        // debug('userApps->', Matrix.localApps);
        console.log('Installed Apps:'.green, _.map( Matrix.localApps, 'name' ).join(', ').grey)

        // for deviceapps installs. idk if this is useful yet.
        // Matrix.service.firebase.deviceapps.getInstalls( function(apps){
        //   debug('device apps records', _.keys(apps));
        // })

        var appsDir = fs.readdirSync('apps');
        var appFolders = _.filter(appsDir, function(a){
          return ( a.indexOf('.matrix') > -1 )
        });

        console.log('Local Apps:'.yellow, appFolders.join(', ').grey);
        var fileSystemVariance = appFolders.length - _.map( Matrix.localApps, 'name' ).length;

        console.log('Local / Installed Δ', fileSystemVariance  )
        if ( fileSystemVariance === 0 ){
          debug('Invariance. Clean System. Matching Records')
        } else {
          debug('Variance detected between registered applications and applications on device.')

          // sync new installs to device
          // find apps which aren't on the device yet
          var newApps = _.pickBy( Matrix.localApps, function(a){
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
                console.log('=== Offline Installation === ['.yellow, a.name.toUpperCase(), a.version, ']'.yellow )

                Matrix.service.manager.install({
                  name: a.name,
                  version: a.version || '1.0.0',
                  url: url,
                  id: id
                }, function(err){
                  //cb(err);
                  console.log('Local app update failed ', err);
                });
              }
            })
          });
        }
        cb();
    },
    //Verify if the device has a active applications and stop these
    function stopAllApps(cb){
      debug('Stop all apps...'.green);
      //Retrieve status for each app
      async.each(Object.keys(Matrix.localApps), function (appId, done) {
        Matrix.service.firebase.app.getStatus(appId, function (status) {
           //Set default status to inactive
          if (_.isUndefined(status)) status = "inactive";
          //If the status is active set online false and status inactive on the app
          if(status === "active"){
            Matrix.service.firebase.app.setOnline(appId, false);
            Matrix.service.firebase.app.setStatus(appId, 'inactive');
          }
          done();
        });
      }, function(err) {
        cb();
      });
    },
    function setupFirebaseListeners(cb) {
      debug('Setting up Firebase Listeners...'.green);
      // watch for app installs

      //App uninstalls
      Matrix.service.firebase.app.watchUserAppsRemoval(function (app) {
        debug('Firebase->UserApps->(X)', app.id, ' (' + app.name + ')');
        // app to uninstall!
        // refresh app ids in case of recent install
        Matrix.service.manager.stop(app.name, function (err) {
          Matrix.service.firebase.app.getUserAppIds(function (appIds) {
            if (_.keys(appIds).indexOf(app.id) !== -1) {
              console.log('uninstalling ', app.name + '...');
              Matrix.service.manager.uninstall(app.name, function (err) {
                if (err) return error(err);
                console.log('Successfully uninstalled ' + app.name.green);
              })
            } else {
              console.log('The application ' + app.name + ' isn\'t currently installed on this device');
            }
          });
        });
      });

       //App install update
       Matrix.service.firebase.user.watchAppInstall(Matrix.deviceId, function (app, appId) {
        if (!_.isUndefined(app) && !_.isUndefined(appId)) {
          Matrix.localApps[appId] = app;

          console.log('installing', appId);
          Matrix.service.firebase.deviceapps.get(appId, function (app) {
            debug('App data: ', app);
            var appName = app.meta.shortName || app.meta.name;
            var installOptions = {
              url: app.meta.file || app.file, //TODO only use meta
              name: appName,
              version: app.meta.version || app.version, //TODO only use meta
              id: appId
            }

            debug('Trying to install: ' + appName.yellow);
            Matrix.service.manager.stop(appName, function (err) {
              Matrix.service.manager.install(installOptions, function (err) {
                debug('Finished index install');
                console.log(appName, installOptions.version, 'installed from', installOptions.url);
              });
            }); 
          })
        } else {
          debug('Empty app install triggered');
        }
      });

      cb();
    },

    function checkFirebaseInfo(cb) {
      debug('Checking Firebase Info...'.green);
      Matrix.service.firebase.device.get( function(err, device){
        if(err  || _.isNull(device) ) return cb('Bad Device Record');
        debug('[fb]devices/>'.blue, device)
        Matrix.service.firebase.user.checkDevice( Matrix.deviceId, function (err, device) {
          if (err || _.isNull(device) ) return cb('Bad User Device Record');
          debug('[fb]user/devices/deviceId>'.blue)
          if ( _.has(device, 'apps')){
            _.forIn(device.apps, function(v,k){
              debug(k + ' - ' + v.name);
            });
          } else {
            debug('No apps installed on this device', Matrix.deviceId)
          }
          cb();
        })
      });
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
    log( '['.grey + Matrix.userId.grey + ']'.grey )
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
  Matrix.device.drivers.led.clear();
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

  Matrix.device.drivers.led.clear();
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
    Matrix.device.system.reboot("Memory clean up");
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
