// Welcome to MatrixOS - A JavaScript environment for IoT Applications
var optional = require('optional');
var bleno = optional('bleno');

const mosRepoURL = 'https://raw.githubusercontent.com/matrix-io/matrix-os/master/package.json';
// check gh
checkLatestVersion();

var mainFlowTimeout;
const mainFlowTimeoutSeconds = 30;

// for crash handling
var destroyingProcess = false;
var forceExit = false;

// Flow handling
var checks = {
  registration: false,
  connectivity: false,
  update: false
};

/* GLOBALS */
_ = require('lodash');
async = require('async');
exec = require('child_process').exec;
os = require('os');

require('colors');

var fs = require('fs');

warn = console.log;
log = console.log;
error = console.error;

// based on NODE_ENV, set sensible defaults
var envSettings = getEnvSettings();
// if NODE_ENV=dev then set sane debug
if (envSettings.debug === true && !_.has(process.env, 'DEBUG')) {
  process.env.DEBUG = '*,-engine*,-Component*,-*led*,-gatt,-bleno,-bt-characteristic,-hci';
  // process.env.DEBUG = '*,-engine*';
}

debugLog = require('debug');
debug = debugLog('matrix');

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

// TODO: nest active sensors / services under apps so it's easier to parse and handle situations
Matrix.state = {
  apps: Matrix.activeApplications,
  sensors: Matrix.activeSensors,
  services: Matrix.activeServices
};

// Make Matrix[setting] from env settings for easy access
parseEnvSettings(envSettings);

// Configuration besides env settings
Matrix.config = require('./config');

debug('Debug:', process.env.DEBUG);
debug('====== config ===vvv'.yellow);
debug(Matrix.config, '\n');

// Check that servers exist
var reqKeys = ['apiServer', 'streamingServer'];
var foundKeys = _.intersection(_.keysIn(Matrix), reqKeys);
if (foundKeys.length < reqKeys.length) {
  var missingKeys = _.xor(reqKeys, foundKeys);
  _.each(missingKeys, function (k) {
    console.error('Matrix Registration Requires %s'.red, _.kebabCase(k).yellow);
  });
  onDestroy();
}

debug('', 'ENV:'.grey, Matrix.env.blue, 'API:'.grey, Matrix.apiServer.blue, 'MXSS:'.grey, Matrix.streamingServer.blue);
debug('', 'ENV:'.grey, Matrix.env.blue, 'API:'.grey, Matrix.apiServer.blue, 'MXSS:'.grey, Matrix.streamingServer.blue);

var events = require('events');

//Event Loop - Handles all events. Not to be confused with Matrix.event
Matrix.events = new events.EventEmitter();
// seems like a fair number for now, should cap at 10 apps running
Matrix.events.setMaxListeners(50);
Matrix.events.on('addListener', function (name) {
  debug('+ Event Listener', name);
});

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
  }),
  //used to store device data
  device: new DataStore({
    filename: Matrix.config.path.db.device,
    autoload: true
  })
};

//Initialize device Libraries. Calls module.export.init() if exists.
Matrix.device.init();

// start loading LED animation
Matrix.device.drivers.led.loader3();

// Node-SDK - Use for API Server Communication
// SDK is used mainly for AUTH
Matrix.api = require('matrix-node-sdk');
// This needs to be done after urls are made available via parseEnvSettings
Matrix.api.makeUrls(Matrix.apiServer);

var malosInfoOut = '';
Matrix.device.malos.info(function (data) {
  _.each(data.info, function (i) {
    malosInfoOut += ' ⚙ '.yellow + i.driver_name.blue + ':' + i.base_port + ' | ' + i.notes_for_human.grey + '\n';
  });
});


var offlineCheck = false;
var onlineCheck = false;

function mainFlow(cb) {
  if (mainFlowTimeout) clearTimeout(mainFlowTimeout);
  async.series([
    function (next) {
      if (!offlineCheck)
        offlineSetup(function (err) {
          if (!err) offlineCheck = true;
          next(err);
        });
      else next();
    },
    function (next) {
      if (!onlineCheck)
        onlineSetup(function (err) {
          if (!err) onlineCheck = true;
          next(err);
        });
      else next();
    },
    reconnectSetup
  ], function (err) {
    if (err) {
      //If the error was caused by the network
      if (_.has(err, 'code') && networkErrors.indexOf(err.code) > -1) {
        if (!onlineCheck) console.error('Setup network error (such as timeout, interrupted connection or unreachable host) has occurred. Retrying in '.yellow + mainFlowTimeoutSeconds.toString().green + ' seconds.'.yellow);
        else console.log('Connectivity lost, reconnecting in '.yellow + mainFlowTimeoutSeconds.toString().green + ' seconds.'.yellow);

        //Try again after a specific time has passed
        if (mainFlowTimeout) clearTimeout(mainFlowTimeout);
        mainFlowTimeout = setTimeout(function () {
          mainFlow(function (err) {
            if (!err) debug('The main flow worked after a retry!');
            else debug('The main flow keeps failing even after retrying...');
          });
        }, mainFlowTimeoutSeconds * 1000);
        Matrix.device.drivers.led.timedError(1, function () {
          if (!onlineCheck) Matrix.device.drivers.led.loader3();
          cb();
        });
      } else {
        error('Bad Matrix Initialization', err.message);
        Matrix.device.drivers.led.criticalError(function () {
          onDestroy();
        });
      }
    } else {
      cb();
    }
  });
}

// STEP 1
function offlineSetup(callback) {
  async.series([ //Device offline setup
    // Reads the local device DB to grab device id and secret
    function readLocalDeviceInfo(cb) {
      if (!_.isUndefined(Matrix.deviceId) && !_.isUndefined(Matrix.deviceSecret)) {
        Matrix.preAuth = true;
        console.log('Not using device data from db, using '.yellow + 'MATRIX_DEVICE_ID'.gray + ' and '.yellow + 'MATRIX_DEVICE_SECRET'.gray + ' instead!'.yellow);
        cb();
      } else {
        Matrix.db.device.findOne({
          id: { $exists: true },
          secret: { $exists: true },
          env: Matrix.env
        }, function (err, result) {
          if (err) console.log('Error reading local data!');
          if (!err) {
            if (_.isNull(result)) {
              debug('Sadly, we got no device records :(');
            } else {
              if (_.has(result, 'id') && _.has(result, 'secret')) {
                debug('Device data found: ', result);
                Matrix.deviceId = result.id;
                Matrix.deviceSecret = result.secret;
              } else {
                err = new Error('No id and secret found for this device');
              }
            }
          }
          cb(err);
        });
      }
    },
    // Initialize event and service libraries. Calls module.export.init() if exists.
    function (cb) {
      Matrix.event.init();
      Matrix.service.init();
      cb();
    },
    function deviceRegistration(cb) {

      //If device data isn't present    
      if (!Matrix.service.auth.isSet()) {

        if (!process.env.hasOwnProperty('MATRIX_BLUETOOTH') || process.env.MATRIX_BLUETOOTH !== 'true') { //If no Bluetooth, alert and stop
          console.warn('Missing registration information! This device is not correctly configured.'.yellow);
          console.warn('You can use '.yellow + 'MATRIX CLI'.green + ' to create a device in the platform and then add the '.yellow + 'MATRIX_DEVICE_ID'.gray + ' and '.yellow + 'MATRIX_DEVICE_SECRET'.gray + ' variables. \n\nIf you continue to have problems, please reach out to our support forums at'.yellow + ' http://community.matrix.one'.green);
          process.exit(1);
        } else if (!bleno) { //If using Bluetooth but missing bleno, alert and stop
          console.log('Missing bleno library, please install it and try again');
          console.log('You can install by going to the project folder and then running:');
          console.log('  > npm install bleno');
          process.exit(1);
        }

        //Using Bluetooth correctly
        console.warn('Missing registration information! This device is not correctly configured. \nYou can register and pair via Bluetooth to your device using the '.yellow + 'MATRIX'.green + ' mobile apps.'.yellow);
        console.warn('Alternatively, you can use '.yellow + 'MATRIX CLI'.green + ' to register the device manually to then add the '.yellow + 'MATRIX_DEVICE_ID'.gray + ' and '.yellow + 'MATRIX_DEVICE_SECRET'.gray + ' variables. \n\nIf you continue to have problems, please reach out to our support forums at'.yellow + ' http://community.matrix.one'.green);

        //Starts BLE registration advertising (Live device registration)
        Matrix.device.bluetooth.start(function () {
          console.log('Waiting for BLE pairing'.yellow);

          function onAuth(err, uuid, options) {
            if (!err) {
              console.log('Received BLE device info:', options);
              Matrix.service.auth.set(options.id, options.secret, function (err) {
                if (!err) {
                  console.log('Device configured as:'.yellow, Matrix.deviceId.green);
                  //Removes the listener on successful auth, although it might not really be a big deal 
                  //Matrix.device.bluetooth.emitter.removeListener('deviceAuth', onAuth);
                  setTimeout(function () {
                    //Give it some time to close the connection
                    cb(); //Continue setup process
                  }, 1000);
                } else {
                  cb(new Error('Unable to store device info! (' + err.message + ')'));
                }
              }); //Update device id and device secret

            } else {
              Matrix.device.drivers.led.timedError(0.5, function () {
                Matrix.device.bluetooth.updateLed();
                //cb(err); //Don't return, just wait for a proper registration
              });
            }
          }
          Matrix.device.bluetooth.emitter.on('deviceAuth', onAuth);
        });

      } else {
        console.log('Starting as device:'.yellow, Matrix.deviceId.green);
        cb();
      }
    },
    function startConfigurationBLE(cb) {

      // env vars have creds, skip BT
      if (Matrix.preAuth === true) {
        return cb();
      }

      //If BLE isn't specified in an env var then skip it
      if (!process.env.hasOwnProperty('MATRIX_BLUETOOTH') || process.env.MATRIX_BLUETOOTH !== 'true') return cb();
      if (!bleno) {
        console.log('Missing bleno library, please install it and try again');
        console.log('You can install by going to the project folder and then running:');
        console.log('  > npm install bleno');
        process.exit(1);
      }

      //Starts BLE configuration
      Matrix.device.bluetooth.start(function () {
        Matrix.device.bluetooth.emitter.on('configurationAuth', function (err, uuid, auth) {
          if (err || !auth) {
            console.log('No BT auth provided', err);
          } else {
            console.log('BT Successfully authenticated!');
          }
        });
        cb(); //Continue device initialization
      });
    }
  ],
    function offlineSetupEnds(err) {
      if (err) console.error('Unable to setup offline MOS, something went wrong (' + err.message + ')');
      else debug('Offline setup successful');
      callback(err);
    }
  );
}

// STEP 2
function onlineSetup(callback) {
  async.series([ //Device online setup
    // Make sure we can see the API server for auth
    function checkApiServer(cb) {
      debug('Checking API server...'.green);
      require('https').get(Matrix.apiServer, function (res) {
        checks.connectivity = true;
        cb();
      }).on('error', function () {
        error('No API Server Visible', Matrix.apiServer);
        checks.connectivity = false;
        cb();
      });
    },


    // Authenticate using current device data
    function getToken(cb) {
      Matrix.service.token.populate(function (err) {
        if (err) {
          if (!_.isEmpty(err.status_code) && err.status_code === 400) { //Device not found
            //Possibly trigger a device configuration reset?,
            //Alternatively ignore deviceId and secret and go back to BLE device registration?
            console.warn('Please make sure your device is properly registered and you are using the proper environment.');
            return onDestroy();
          } else {
            cb(err);
          }
        } else {
          cb(err);
        }
      });
    },

    // Lets login to the streaming server
    function mxssInit(cb) {

      if (!process.env.hasOwnProperty('MATRIX_NOMXSS')) {
        Matrix.service.stream.initSocket(cb);
      } else {
        cb();
      }

    },

    // Initialize Firebase
    function firebaseInit(cb) {
      debug('Starting Firebase...'.green + ' U:', Matrix.userId, ', D: ', Matrix.deviceId, ', DT: ', Matrix.deviceToken);
      Matrix.service.firebase.init(Matrix.userId, Matrix.deviceId, Matrix.deviceToken, Matrix.env, function (err, deviceId) {
        if (err) {
          return cb(err);
        } else {
          Matrix.service.firebase.initialized = true;
        }
        if (deviceId !== Matrix.deviceId) {
          return cb('firebase / deviceid mismatch' + deviceId + ' != ' + Matrix.deviceId);
        }
        cb(err, deviceId);
      });
    },

    // Update local app folders according to device remote configuration
    function syncApps(cb) {
      // Gets all apps

      // this is populated from init>getallapps
      Matrix.localApps = Matrix.service.firebase.util.records.apps || Matrix.localApps;
      // debug('userApps->', Matrix.localApps);
      console.log('Installed Apps:'.green, _.map(Matrix.localApps, 'name').join(', ').grey);

      // for deviceapps installs. idk if this is useful yet.
      // Matrix.service.firebase.deviceapps.getInstalls( function(apps){
      //   debug('device apps records', _.keys(apps));
      // })


      fs.readdir(Matrix.config.path.apps, function (err, appsDir) {
        if (err) {
          console.error('Unable to read apps folder: ', err.message);
          return cb(err);
        }

        var appFolders = _.filter(appsDir, function (a) {
          return (a.indexOf('.matrix') > -1);
        });

        console.log('Local Apps:'.yellow, appFolders.join(', ').grey);
        var fileSystemVariance = appFolders.length - _.map(Matrix.localApps, 'name').length;

        console.log('Local / Installed Δ', fileSystemVariance);
        if (fileSystemVariance === 0) {
          debug('Invariance. Clean System. Matching Records');
        } else {
          debug('Variance detected between registered applications and applications on device.');

          // sync new installs to device
          // find apps which aren't on the device yet
          //TODO also consider updating those with newer version available
          var newApps = _.pickBy(Matrix.localApps, function (a) {
            return (appFolders.indexOf(a.name + '.matrix') === -1);
          });

          _.forIn(newApps, function (a, id) {
            Matrix.service.firebase.appstore.get(id, function (appRecord) {

              // for version id in firebase 1_0_0
              var vStr = _.snakeCase(a.version || '1.0.0');
              var vId = id + '-' + vStr;

              if (appRecord.versions[vId]) {
                var url = appRecord.versions[vId].file;

                // filter out test appstore records
                if (url.indexOf('...') === -1) {
                  console.log('=== Offline Installation === ['.yellow, a.name.toUpperCase(), a.version, ']'.yellow);

                  Matrix.service.manager.install({
                    name: a.name,
                    version: a.version || '1.0.0',
                    url: url,
                    id: id
                  }, function (err) {
                    //cb(err);
                    if (err) console.log('Local app update failed ', err);
                  });
                }
              } else { 
                console.log('Application'.red, a.name.yellow, '('.red + id.yellow + ')'.red, a.version.yellow, 'is missing version'.red, vId.yellow, 'details'.red);
              }
            });
          });
        }
        cb();
      });
    },

    // Reset apps status in Firebase to Inactive
    Matrix.service.manager.resetAppStatus,

    //Listens for apps deploy, install and removal
    function setupFirebaseListeners(cb) {
      debug('Setting up Firebase Listeners...'.green);

      //If we don't want the device to handle installs
      if (process.env.hasOwnProperty('NO_INSTALL')) {
        return cb();
      }

      //App uninstalls
      Matrix.service.firebase.app.watchUserAppsRemoval(function (app) {
        debug('Firebase->UserApps->(X)', app.id, ' (' + app.name + ')');
        // app to uninstall!
        // refresh app ids in case of recent install
        Matrix.service.manager.stop(app.name, function (err) {
          if (err) console.error('Unable to stop app');
          console.log('app stopped', app.name);
          Matrix.service.firebase.app.getUserAppIds(function (appIds) {
            if (_.keys(appIds).indexOf(app.id) === -1) {
              console.log('uninstalling ', app.name + '...');
              Matrix.service.manager.uninstall(app.name, function (err) {
                if (err) return error(err);
                console.log('Successfully uninstalled ' + app.name.green);
              });
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
              id: appId,
              running: Matrix.activeApplications.some((a) => {
                return (a.name === appName);
              })
            };

            debug('Trying to install: ' + appName.yellow);
            Matrix.service.manager.stop(appName, function (err, appStopped) {
              Matrix.service.manager.install(installOptions, function (err) {
                debug('Finished index install');
                console.log(appName, installOptions.version, 'installed from', installOptions.url);
                //TODO Start the app if it was running before deployment?
                //if (appStopped) Matrix.service.manager.start(appName);
              });
            });
          });
        } else {
          debug('Empty app install triggered');
        }
      });

      cb();
    },

    //Firebase records integrity check
    function checkFirebaseInfo(cb) {
      debug('Checking Firebase Info...'.green);
      Matrix.service.firebase.device.get(function (err, device) {
        if (err || _.isNull(device)) return cb('Bad Device Record');
        debug('[fb]devices/>'.blue, device);
        Matrix.service.firebase.user.checkDevice(Matrix.deviceId, function (err, device) {
          if (err || _.isNull(device)) return cb('Bad User Device Record');
          debug('[fb]user/devices/deviceId>'.blue);
          if (_.has(device, 'apps')) {
            _.forIn(device.apps, function (v, k) {
              debug(k + ' - ' + v.name);
            });
          } else {
            debug('No apps installed on this device', Matrix.deviceId);
          }
          cb();
        });
      });
    }
  ],
    function onlineSetupEnds(err) {
      if (err) {
        var errorCode = err.code ? err.code : err.status_code;
        console.error('Unable to setup online MOS, something went wrong (' + errorCode + ') (' + err.message + ')');
        callback(err);
      } else {

        Matrix.device.drivers.led.stopLoader();
        Matrix.device.drivers.led.clear();

        // MXSS
        if (Matrix.registerOK) log('MXSS Connected:'.green, Matrix.streamingServer.grey);
        else error('MXSS Unavailable'.red);

        // MALOS
        if (malosInfoOut.length > 0) log('MALOS COMPONENTS', malosInfoOut);
        else error('MALOS Unavailable'.red);

        // MOS
        log(Matrix.is.green.bold, '['.grey + Matrix.deviceId.grey + ']'.grey, 'ready'.yellow.bold);
        log('['.grey + Matrix.userId.grey + ']'.grey);
        Matrix.banner();

        //if START_APP is set
        if (Matrix.config.fakeApp) Matrix.service.manager.start(Matrix.config.fakeApp);
        //for tests
        Matrix.events.emit('matrix-ready');

        if (Matrix.hasOwnProperty('latestVersion') && Matrix.latestVersion !== Matrix.version) {
          console.log('MATRIX OS can be upgraded.'.yellow, Matrix.latestVersion, 'available!'.yellow, Matrix.version);
        }

        // CLI uses IPC for tests
        if (process.hasOwnProperty('send')) process.send({ 'matrix-ready': true });

        if (process.env.hasOwnProperty('REPL')) {
          const repl = require('repl');
          repl.start('> ').context.Matrix = Matrix;
        }

        Matrix.service.lifecycle.updateLastBootTime();
        debug('Online setup successful!');
        callback();
      }
    });

  /*
  ███    ███  █████  ████████ ██████  ██ ██   ██
  ████  ████ ██   ██    ██    ██   ██ ██  ██ ██
  ██ ████ ██ ███████    ██    ██████  ██   ███
  ██  ██  ██ ██   ██    ██    ██   ██ ██  ██ ██
  ██      ██ ██   ██    ██    ██   ██ ██ ██   ██
  */
}


// STEP 3 (This should probably be triggered whenever the device reconnects)
function reconnectSetup(callback) {
  //Matrix.service.firebase.device.goCompleted(); //We are no using the FB queue to notify the status
  //Additional reconnection logic could be handle here
  callback();
}


mainFlow(function (err) {
  if (!err) debug('The main flow worked on the first attempt!');
  else debug('The main flow is taking some time to get started...');
}); //Set the wheels in motion

module.exports = {
  Matrix: Matrix
};



// Process Level Event Listeners

//Triggered when the application is killed by a [CRTL+C] from keyboard
process.on('SIGINT', function () {
  log('Matrix -- CTRL+C kill detected');
  Matrix.device.drivers.led.clear();
  disconnectFirebase(function () {
    process.exit(0);
  });
});

//Triggered when the application is killed with a -15
process.on('SIGTERM', function () {
  log('Matrix -- Kill detected');
  Matrix.device.drivers.led.clear();
  onKill();
});

//Triggered when the application is killed by a [CRTL+\] from keyboard
process.on('SIGQUIT', function () {
  log('Matrix -- CRTL+\\ kill detected');
  onKill();
});


/*
@method onKill
@description Used to unify the behavior of all kill signals
*/
function onKill() {
  if (!destroyingProcess) {
    log('Matrix -- Application Closing...');
    onDestroy();
  } else {
    log('Matrix -- Already closing, please wait a few seconds...');
  }
}

/*
@method onDestroy
@description Stop process before stop application
*/
function onDestroy(cb) {
  //TODO Consider adding a setTimeout>process.exit if all else fails
  //TODO: Implemenent cleanups
  // kill children apps\
  debug('DESTROYING'.red);
  destroyingProcess = true;

  Matrix.device.drivers.led.clear();
  Matrix.device.network.stop();
  if (!forceExit) {
    disconnectFirebase(function () {
      async.series([
        Matrix.service.manager.killAllApps,
        Matrix.service.manager.clearAppList,
        Matrix.service.manager.cleanLogs,
        Matrix.service.stream.persistCache,
        // Matrix.device.drivers.clear
      ], function (err) {
        if (err) error(err);
        // Used to Clean up Tests
        if (_.isFunction(cb)) { cb(); }
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
    Matrix.service.manager.resetAppStatus();
    cb();
  } else {
    debug('Firebase wasn\'t initialized');
    cb();
  }
}

// every 4 hours do this
setInterval(function maintenance() {
  Matrix.service.manager.cleanLogs();
}, 1000 * 60 * 60 * 4);

const networkErrors = [
  'EAI_AGAIN',
  'ENOTFOUND',
  'EAFNOSUPPORT',
  'ETIMEDOUT'
];

//Triggered when an unexpected (programming) error occurs
//Also called when a DNS error is presented
process.on('uncaughtException', function (err) {
  console.error('Uncaught exception: ', err, err.stack);
  if (err.code && err.code === 'ENOTFOUND') {
    error('ENOTFOUND (Connectivity error)');
    //TODO Attempt to restablish connectivity? Matrix.device.manager.setupDNS();
  } else if (err.code && err.code === 'EAFNOSUPPORT') {
    error('EAFNOSUPPORT (Connectivity error)');
    //TODO Attempt to restablish connectivity? Matrix.device.manager.setupDNS();
  } else if (err.code && err.code === 'ETIMEDOUT') {
    error('ETIMEDOUT (Connectivity error)');
    //TODO Attempt to restablish connectivity? Matrix.device.manager.setupDNS();
  } else if (err.code && err.code === 'ENOMEM') {
    error('ENOMEM was detected (Out of memory)');
    // error(err.stack);
    Matrix.device.system.reboot('Memory clean up');
  } else {
    forceExit = true;
    console.error('UNKNOWN ERROR!'.red, err.stack);

    onDestroy();
  }
});


// UTILITY
function getEnvSettings(env) {
  var environmentSetting = env || process.env.NODE_ENV || 'production';
  var validEnvList = fs.readdirSync(__dirname + '/config/env');
  if (_.intersection(environmentSetting, validEnvList).length > -1) {
    console.log('Environment Selected:'.grey, environmentSetting.blue);
    return require(__dirname + '/config/env/' + environmentSetting + '.js');
  }

}

function parseEnvSettings(envSettings) {
  if (!_.isEmpty(envSettings.deviceId)) Matrix.deviceId = envSettings.deviceId;
  if (!_.isEmpty(envSettings.deviceSecret)) Matrix.deviceSecret = envSettings.deviceSecret;
  if (_.has(envSettings, 'url')) {
    Matrix.streamingServer = envSettings.url.streaming;
    Matrix.apiServer = envSettings.url.api;
    Matrix.env = envSettings.name;
  } else {
    console.error('There is a problem with ENV', Matrix.env);
  }
}

Matrix.haltTheMatrix = function (cb) {
  onDestroy();
};


function upgradeDependencies(cb) {

  var updated = false;
  var helper = require('matrix-app-config-helper');
  var eventFilter = require('matrix-eventfilter');
  var piwifi = require('pi-wifi');

  //Get recent version
  async.parallel({
    helperVersion: function (cb) {
      if (_.has(helper, 'checkVersion')) helper.checkVersion(function (err, version) {
        console.log('DEP helper: ', err, version);
        cb(err, version.updated);
      });
      else cb(undefined, helper.current);
    },
    apiVersion: function (cb) {
      if (_.has(Matrix.api, 'checkVersion')) Matrix.api.checkVersion(function (err, version) {
        console.log('DEP api: ', err, version);
        cb(err, version.updated);
      });
      else cb(undefined, Matrix.api.current);
    },
    firebaseVersion: function (cb) {
      if (_.has(Matrix.service.firebase, 'checkVersion')) Matrix.service.firebase.checkVersion(function (err, version) {
        console.log('DEP firebase: ', err, version);
        cb(err, version.updated);
      });
      else cb(undefined, Matrix.service.firebase.current);
    },
    eventVersion: function (cb) {
      if (_.has(eventFilter, 'checkVersion')) eventFilter.checkVersion(function (err, version) {
        console.log('DEP event: ', err, version);
        cb(err, version.updated);
      });
      else cb(undefined, eventFilter.current);
    },
    piwifiVersion: function (cb) {
      if (_.has(piwifi, 'checkVersion')) piwifi.checkVersion(function (err, version) {
        console.log('DEP pi: ', err, version);
        cb(err, version.updated);
      });
      else cb(undefined, piwifi.current);
    }

  },
    function versionResults(err, results) {
      var olds = _.filter(results, function (o) { return o === false; });
      if (olds.length > 0) {
        console.log('Upgrading Dependencies....'.yellow);
        exec('npm upgrade matrix-node-sdk matrix-app-config-helper matrix-firebase matrix-eventfilter pi-wifi', function (error, stdout, stderr) {
          if (error) {
            console.error('Error upgrading dependencies: '.red + error);
            err = error;
          } else {
            checks.update = true;
            updated = true;
            console.log('Dependencies upgrade Done!'.green, 'MATRIX OS restart required.');
          }
          cb(err);
        });
      } else {
        console.log('Dependencies up to date.');
        cb(err, updated);
      }
    });

}

function upgradeMOS(cb) {
  fs.readFile(__dirname + '/package.json', function (err, info) {
    if (err) {
      console.error('Unable to read package.json file'.red, err.message);
      return cb(err, false);
    }

    try {
      info = JSON.parse(info);
    } catch (error) {
      err = error;
    }
    if (err) {
      console.error('Unable to parse package.json file'.red, err.message);
      return cb(err, false);
    }
    var currentVersion = info.version;

    //Check the MOS 
    function processMOSVersion(remoteVersion, cb) {
      var err;
      var updated = false;
      if (currentVersion === remoteVersion) {
        debug('Latest Version Installed. ' + currentVersion.grey);
        checks.update = true;
        cb(err, updated);
      } else {
        //TODO Start Update LED motion
        updated = true;
        checks.update = true;
        console.log('MATRIX OS Upgrade Ready. ' + remoteVersion + ' now available.\n', 'Upgrading MATRIX OS....'.yellow);
        exec('git submodule update --init', function (error, stdout, stderr) {
          err = error;
          if (!err) {
            console.log('Modules updated... '.green);
            exec('git fetch && git pull', function (error, stdout, stderr) {
              err = error;
              if (!err) {
                console.log('Main code updated... '.green);
                console.log('Upgrade Complete: MATRIX OS restart required'.green);
              } else { //Code update failed
                debug('Error updating main code:\n', err.message);
                console.error('Unable to update MATRIX OS main code'.yellow);
                console.error('Please make sure you haven\'t modified any files ('.yellow + 'git status'.gray + '), check your connection and try again'.yellow);
                console.error('Alternatively, you can run MATRIX OS without the upgrade check in the meantime \''.yellow + 'NO_UPGRADE=true node index.js'.gray + '\''.yellow);
              }
              cb(err, updated);
            });
          } else { //Git submodules update failed
            debug('Error updating modules:\n', err.message);
            console.error('Unable to update MATRIX OS submodules'.yellow);
            console.error('Try \''.yellow + 'git submodule deinit -f ; git submodule update --init'.gray + '\' to fix your modules'.yellow);
            console.error('Alternatively, you can run MATRIX OS without the upgrade check in the meantime \''.yellow + 'NO_UPGRADE=true node index.js'.gray + '\''.yellow);
            cb(err, updated);
          }

        });
      }
    }

    //Send the actual request
    require('request').get(mosRepoURL, function (err, resp, body) {
      if (err) return console.error(err);

      try {
        Matrix.latestVersion = JSON.parse(body).version;
      } catch (error) {
        console.error('Unable to parse MATRIX OS version info:', error.message);
      }

    });

  });
}


function checkLatestVersion() {

  //Send the actual request
  require('request').get(mosRepoURL, function (err, resp, body) {
    if (err) return console.error(err);

    try {
      Matrix.latestVersion = JSON.parse(body).version;
      Matrix.version = JSON.parse(fs.readFileSync(__dirname + '/package.json')).version;
    } catch (error) {
      console.error('Unable to parse MATRIX OS version info:', error.message);
    }

  });
}
