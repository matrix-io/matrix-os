// Welcome to MatrixOS - A JavaScript environment for IoT Applications

const mosRepoURL = 'https://raw.githubusercontent.com/matrix-io/matrix-os/master/package.json';

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

require('colors');

var fs = require('fs');

// Logging Utilities
ulog = function() {
  _.each(arguments, function(a) {
    console.log(require('util').inspect(a, { depth: null, colors: true }))
  })
};

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

// Make Matrix[setting] from env settings for easy access
parseEnvSettings(envSettings);

//Matrix.deviceId = envSettings.deviceId;
//Matrix.deviceSecret = envSettings.deviceSecret;

// Configuration besides env settings
Matrix.config = require('./config');

debug('Debug:', process.env.DEBUG);
debug('====== config ===vvv'.yellow)
debug(Matrix.config, '\n');

// Check that servers and device Id exists.
var reqKeys = ['deviceId', 'apiServer', 'streamingServer'];
var foundKeys = _.intersection(_.keysIn(Matrix), reqKeys);
if (foundKeys.length < reqKeys.length) {
  var missingKeys = _.xor(reqKeys, foundKeys);
  _.each(missingKeys, function(k) {
    console.error('Matrix Registration Requires %s'.red, _.kebabCase(k).yellow);
  })
  process.exit(1);
}

debug('', 'ENV:'.grey, Matrix.env.blue, 'API:'.grey, Matrix.apiServer.blue, 'MXSS:'.grey, Matrix.streamingServer.blue)

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
Matrix.device.drivers.led.loader3();

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
  }),
  //used to store device data
  device: new DataStore({
    filename: Matrix.config.path.db.device,
    autoload: true
  })
}

var malosInfoOut = '';
Matrix.device.malos.info(function(data) {
  _.each(data.info, function(i) {
    malosInfoOut += ' ⚙ '.yellow + i.driver_name.blue + ':' + i.base_port + ' | ' + i.notes_for_human.grey + '\n';
  })
})

var msg = [];

function upgradeDependencies(cb) {
  var err;
  var updated = false;
  var deps = [Matrix.service.firebase, Matrix.api, require('matrix-app-config-helper'), require('matrix-eventfilter'), require('pi-wifi')];
  var olds = _.filter(deps, { current: false });

  if (olds.length > 0) {
    console.log('Upgrading Dependencies....'.yellow)
    exec('npm upgrade matrix-node-sdk matrix-app-config-helper matrix-firebase matrix-eventfilter pi-wifi', function(error, stdout, stderr) {
      if (error) {
        console.error('Error upgrading dependencies: '.red + error);
        err = error;
      } else {
        checks.update = true;
        updated = true;
        console.log('Upgrade Done!'.green, 'Please restart MATRIX OS.');
      }
      cb(err);
    });
  } else {
    console.log('Dependencies up to date.')
    cb(err, updated);
  }
}

function upgradeMOS(cb) {
  fs.readFile('package.json', function(err, info) {
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
        debug('Latest Version Installed. ' + currentVersion.grey)
        checks.update = true;
        cb(err, updated);
      } else {
        //TODO Start Update LED motion
        updated = true;
        checks.update = true;
        console.log('MATRIX OS Upgrade Ready. ' + remoteVersion + ' now available.\n', 'Upgrading MATRIX OS....'.yellow)
        exec('git submodule update --init', function(error, stdout, stderr) {
          err = error;
          if (!err) {
            console.log('Modules updated... '.green)
            exec('git fetch && git pull', function(error, stdout, stderr) {
              err = error;
              if (!err) {
                console.log('Main Code updated... '.green)
                console.log('Upgrade Complete: Restart MATRIX OS... '.green)
              } else { //Code update failed
                debug('Error updating main code:\n', err.message);
                console.error('Unable to update MOS main code'.yellow);
                console.error('Please make sure you haven\'t modified any files ('.yellow + 'git status'.gray + '), check your connection and try again'.yellow);
                console.error('Alternatively, you can run MOS without the upgrade check in the meantime \''.yellow + 'NO_UPGRADE=true node index.js'.gray + '\''.yellow);
              }
              cb(err);
            });
          } else { //Git submodules update failed
            debug('Error updating modules:\n', err.message);
            console.error('Unable to update MOS submodules'.yellow);
            console.error('Try \''.yellow + 'git submodule deinit -f ; git submodule update --init'.gray + '\' to fix your modules'.yellow);
            console.error('Alternatively, you can run MOS without the upgrade check in the meantime \''.yellow + 'NO_UPGRADE=true node index.js'.gray + '\''.yellow);
            cb(err, updated);
          }

        });
      }
    }

    //Send the actual request
    require('https').get(mosRepoURL, function(res) {
      // console.log(res);
      var write = '';
      res.on('data', function(c) { write += c; })
      res.on('end', function() {
        //Get version from results
        var version, err;
        try {
          version = JSON.parse(write).version;
        } catch (error) {
          console.error('Unable to parse MOS version file:', error.message);
          err = error;
        }

        //If successful, process version
        if (!err) processMOSVersion(version, cb);
        else return cb(err);
      });
    }).on('error', function(e) {
      console.error('Upgrade Check Error: ', e);
      return cb(e);
    })

  });
}

//Start MATRIX init flow once a device has been configured
function deviceSetup() {

  async.series([
    Matrix.service.token.populate, //Authenticate with current data

    // Make sure we can see the API server for auth
    function checkApiServer(cb) {
      debug('Checking API server...'.green);
      require('http').get(Matrix.apiServer, function(res) {
        checks.connectivity = true;
        cb(null);
      }).on('error', function() {
        error('No API Server Visible', Matrix.apiServer);
        checks.connectivity = false;
        cb();
      });
    },

    // Check for updates to MOS and dependencies **
    function checkUpdates(cb) {
      // in case you want to skip the upgrade for whatever reason
      if (process.env.hasOwnProperty('NO_UPGRADE') || checks.update === true) {
        cb();
        return;
      }

      // check dependencies - eventfilter is used for apps

      upgradeDependencies(function(err, updated) {
        if (err) console.error('Unable to upgrade dependencies:'.red, err);
        if (updated) process.exit();

        upgradeMOS(function(err, updated) {
          if (err) {
            console.error('Unable to upgrade dependencies:'.red, err);
            process.exit();
          }

          if (updated) {
            debug('Stopping after upgrade');
            process.exit();
          }
          cb(err);
        });

      });
    },

    function mxssInit(cb) {

      // Now that we have a token, lets login to the streaming server
      debug('Checking MXSS...'.green);
      // extremely unlikely event that the mxss is bad and we need to skip
      if (!process.env.hasOwnProperty('MATRIX_NOMXSS')) {
        Matrix.service.stream.initSocket(cb);
      } else {
        cb()
      }
    },

    // token also lets us access firebase
    function firebaseInit(cb) {
      debug('Starting Firebase...'.green + ' U:', Matrix.userId, ', D: ', Matrix.deviceId, ', DT: ', Matrix.deviceToken);
      Matrix.service.firebase.init(Matrix.userId, Matrix.deviceId, Matrix.deviceToken, Matrix.env, function(err, deviceId) {
        if (err) {
          return cb(err);
        } else {
          Matrix.service.firebase.initialized = true;
        }
        if (deviceId !== Matrix.deviceId) {
          return cb('firebase / deviceid mismatch' + deviceId + ' != ' + Matrix.deviceId)
        }
        cb(err, deviceId);
      });
    },

    function syncApps(cb) {
      // Gets all apps

      // this is populated from init>getallapps
      Matrix.localApps = Matrix.service.firebase.util.records.apps ||  Matrix.localApps;
      // debug('userApps->', Matrix.localApps);
      console.log('Installed Apps:'.green, _.map(Matrix.localApps, 'name').join(', ').grey)

      // for deviceapps installs. idk if this is useful yet.
      // Matrix.service.firebase.deviceapps.getInstalls( function(apps){
      //   debug('device apps records', _.keys(apps));
      // })


      fs.readdir('apps', function(err, appsDir) {
        if (err) {
          console.error('Unable to read apps folder: ', err.message);
          return cb(err);
        }

        var appFolders = _.filter(appsDir, function(a) {
          return (a.indexOf('.matrix') > -1)
        });

        console.log('Local Apps:'.yellow, appFolders.join(', ').grey);
        var fileSystemVariance = appFolders.length - _.map(Matrix.localApps, 'name').length;

        console.log('Local / Installed Δ', fileSystemVariance)
        if (fileSystemVariance === 0) {
          debug('Invariance. Clean System. Matching Records')
        } else {
          debug('Variance detected between registered applications and applications on device.')

          // sync new installs to device
          // find apps which aren't on the device yet
          var newApps = _.pickBy(Matrix.localApps, function(a) {
            return (appFolders.indexOf(a.name + '.matrix') === -1)
          })

          _.forIn(newApps, function(a, id) {
            Matrix.service.firebase.appstore.get(id, function(appRecord) {

              // for version id in firebase 1_0_0
              var vStr = _.snakeCase(a.version || '1.0.0');
              var vId = id + '-' + vStr;

              var url = appRecord.versions[vId].file;

              // filter out test appstore records
              if (url.indexOf('...') === -1) {
                console.log('=== Offline Installation === ['.yellow, a.name.toUpperCase(), a.version, ']'.yellow)

                Matrix.service.manager.install({
                  name: a.name,
                  version: a.version || '1.0.0',
                  url: url,
                  id: id
                }, function(err) {
                  //cb(err);
                  if (err) console.log('Local app update failed ', err);
                });
              }
            })
          });
        }
        cb();
      });
    },

    //Stop apps in firebase if started
    Matrix.service.manager.resetAppStatus,

    function setupFirebaseListeners(cb) {
      debug('Setting up Firebase Listeners...'.green);
      // watch for app installs
      //
      if (process.env.hasOwnProperty('NO_INSTALL')) {
        return cb();
      }

      //App uninstalls
      Matrix.service.firebase.app.watchUserAppsRemoval(function(app) {
        debug('Firebase->UserApps->(X)', app.id, ' (' + app.name + ')');
        // app to uninstall!
        // refresh app ids in case of recent install
        Matrix.service.manager.stop(app.name, function(err) {
          if (err) console.error('Unable to stop app');
          console.log('app stopped', app.name)
          Matrix.service.firebase.app.getUserAppIds(function(appIds) {
            if (_.keys(appIds).indexOf(app.id) === -1) {
              console.log('uninstalling ', app.name + '...');
              Matrix.service.manager.uninstall(app.name, function(err) {
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
      Matrix.service.firebase.user.watchAppInstall(Matrix.deviceId, function(app, appId) {
        if (!_.isUndefined(app) && !_.isUndefined(appId)) {
          Matrix.localApps[appId] = app;

          console.log('installing', appId);
          Matrix.service.firebase.deviceapps.get(appId, function(app) {
            debug('App data: ', app);
            var appName = app.meta.shortName || app.meta.name;
            var installOptions = {
              url: app.meta.file || app.file, //TODO only use meta
              name: appName,
              version: app.meta.version || app.version, //TODO only use meta
              id: appId
            }

            debug('Trying to install: ' + appName.yellow);
            Matrix.service.manager.stop(appName, function(err, appStopped) {
              Matrix.service.manager.install(installOptions, function(err) {
                debug('Finished index install');
                console.log(appName, installOptions.version, 'installed from', installOptions.url);
                //TODO Start the app if it was running before deployment?
                //if (appStopped) Matrix.service.manager.start(appName);
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
      Matrix.service.firebase.device.get(function(err, device) {
        if (err || _.isNull(device)) return cb('Bad Device Record');
        debug('[fb]devices/>'.blue, device)
        Matrix.service.firebase.user.checkDevice(Matrix.deviceId, function(err, device) {
          if (err || _.isNull(device)) return cb('Bad User Device Record');
          debug('[fb]user/devices/deviceId>'.blue)
          if (_.has(device, 'apps')) {
            _.forIn(device.apps, function(v, k) {
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
      if (checks.connectivity === false) {
        console.error('Network error, please make sure you have a valid connection and try again'.yellow);
        //TODO Try again after a specific time has passed
        //deviceSetupTimeout = setTimeout(deviceSetup, 60000);
        // Matrix.device.drivers.led.error();
        //TODO Connectivity error needs to be handled gracefully
        // Sample error message in err = 'matrix A network error (such as timeout, interrupted connection or unreachable host) has occurred.'
      } else {
        return error('Bad Matrix Initialization', err);
        //Matrix.haltTheMatrix();
      }
    } else {
      Matrix.service.firebase.device.goCompleted();
      Matrix.device.drivers.led.stopLoader();
      Matrix.device.drivers.led.clear();

      //TODO start configuration BLE advertising
      Matrix.device.bluetooth.start();
      Matrix.device.bluetooth.emitter.on('configurationAuth', function(err, uuid, auth) {
        if (err ||  !auth) {
          console.log('No BT auth provided', err);
        } else {
          console.log('BT Successfully authenticated!');
        }
      });

      // debug('vvv MATRIX vvv \n'.yellow,
      // require('util').inspect( _.omit(Matrix, ['device','password','username','events','service','db']), { depth : 0} ), "\n^^^ MATRIX ^^^ ".yellow);
      if (err) { error(err); }
      if (Matrix.registerOK) {
        log('MXSS Connected:'.green, Matrix.streamingServer.grey)
      }

      if (malosInfoOut.length > 0) {
        log('MALOS COMPONENTS', malosInfoOut);
      } else {
        error('MALOS Unavailable'.red)
      }
      log(Matrix.is.green.bold, '['.grey + Matrix.deviceId.grey + ']'.grey, 'ready'.yellow.bold);
      log('['.grey + Matrix.userId.grey + ']'.grey)
      Matrix.banner();
      if (msg.length > 0) {
        console.log(msg.join('\n').red);
      }

      //if START_APP is set
      if (Matrix.config.fakeApp) {
        Matrix.service.manager.start(Matrix.config.fakeApp);
      }

      //for tests
      Matrix.events.emit('matrix-ready');

      // CLI uses IPC for tests
      if (process.hasOwnProperty('send')) {
        process.send({ 'matrix-ready': true })
      }

      if (process.env.hasOwnProperty('REPL')) {
        const repl = require('repl');
        repl.start('> ').context.Matrix = Matrix;
      }

      Matrix.service.lifecycle.updateLastBootTime();
    }
  });
}

readLocalDeviceInfo(function(err) {
  if (err) console.log('Error reading local data!');
  //Check if device id and secret are set as env vars
  Matrix.service.token.populate(function(err) { //Authenticate with current data

    if (!_.isUndefined(err)) { //Initialized properly but missing valid device id and secret
      //TODO take into account network error
      console.warn('Incorrect or missing registration information. This device is not correctly configured. Please add MATRIX_DEVICE_ID and MATRIX_DEVICE_SECRET variables. If you do not have these available, you can get them by issuing `matrix register device` with matrix CLI or by registering your device using the mobile apps. \n\nIf you continue to have problems, please reach out to our support forums at http://community.matrix.one'.yellow);
      console.log('Waiting for BLE pairing'.yellow);

      //Wait for mobile pairing
      Matrix.device.bluetooth.start(function() {
        Matrix.device.bluetooth.emitter.on('deviceAuth', function(err, uuid, options) {
          if (err) console.log(err);
          if (options) console.log(options);

          if (!err) {
            console.log('Received BLE device info:', options);
            Matrix.service.auth.set(options.id, options.secret, function(err) {
              if (!err) {
                console.log('Device configured as:'.yellow, Matrix.deviceId.green);
                deviceSetup(); //Continue setup process     
              } else {
                console.error('Unable to store device info');
              }
            }); //Update device id and device secret

          } else {
            console.log('Error trying to configure the device', err.message);
          }
        });

      }); //Starts BLE registration advertising

      //TODO Might want to remove the listener on successful auth, although it might not really be a big deal 
      //Matrix.device.bluetooth.emitter.removeListener('deviceAuth', refreshHandler);
      //Matrix.device.bluetooth.emitter.removeListener('configurationAuth', refreshHandler);

    } else { //Correct initialization and already authenticated
      console.log('Starting as device:'.yellow, Matrix.deviceId.green);
      deviceSetup(); //Continue setup process
    }

  });
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
process.on('SIGINT', function() {
  log('Matrix -- CTRL+C kill detected');
  Matrix.device.drivers.led.clear();
  disconnectFirebase(function() {
    process.exit(0);
  });
});

//Triggered when the application is killed with a -15
process.on("SIGTERM", function() {
  log("Matrix -- Kill detected");
  Matrix.device.drivers.led.clear();
  onKill();
});

//Triggered when the application is killed by a [CRTL+\] from keyboard
process.on('SIGQUIT', function() {
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
  if (!forceExit) {
    disconnectFirebase(function() {
      async.series([
        Matrix.service.manager.killAllApps,
        Matrix.service.manager.clearAppList,
        Matrix.service.manager.cleanLogs,
        // Matrix.device.drivers.clear
      ], function(err) {
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

//Triggered when an unexpected (programming) error occurs
//Also called when a DNS error is presented
process.on('uncaughtException', function(err) {
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
function getEnvSettings(env) {
  // Change to production after leaving alpha
  var environmentSetting = env || process.env.NODE_ENV || 'rc';
  var validEnvList = fs.readdirSync('./config/env');
  if (_.intersection(environmentSetting, validEnvList).length > -1) {
    console.log('Environment Selected:'.grey, environmentSetting.blue);
    return require('./config/env/' + environmentSetting + '.js');
  }

}

function parseEnvSettings(envSettings) {
  Matrix.deviceId = envSettings.deviceId;
  Matrix.deviceSecret = envSettings.deviceSecret;
  if (_.has(envSettings, 'url')) {
    Matrix.streamingServer = envSettings.url.streaming;
    Matrix.apiServer = envSettings.url.api;
    Matrix.env = envSettings.name;
  } else {
    console.error('There is a problem with ENV', Matrix.env);
  }
}


function readLocalDeviceInfo(cb) {
  if (!_.isUndefined(Matrix.deviceId) && !_.isUndefined(Matrix.deviceSecret)) {
    console.log('Not using device data from db, using '.yellow + 'MATRIX_DEVICE_ID'.gray + ' and '.yellow + 'MATRIX_DEVICE_SECRET'.gray + ' instead!'.yellow);
    cb();
  } else {
    Matrix.db.device.findOne({
      id: { $exists: true },
      secret: { $exists: true },
      env: Matrix.env
    }, function(err, result) {
      if (err) return cb(err);
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
      cb(err);
    });
  }
}

Matrix.haltTheMatrix = function(cb) {
  onDestroy();
}