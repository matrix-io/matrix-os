// Welcome to MatrixOS - A JavaScript environment for IoT Applications



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
execSync = require('child_process').execSync;
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

Matrix.ok = {
  credentialsExist: false,
  connected: false,
  registered: false,
  currentMOS: false,
  bluetooth: false
}


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

// datapoints
Matrix.dailyDPCount = [];
for (let i = 0; i < 24; i++) {
  Matrix.dailyDPCount[i] = 0;
}

debug('', 'ENV:'.grey, Matrix.env.blue, 'API:'.grey, Matrix.apiServer.blue, 'MXSS:'.grey, Matrix.streamingServer.blue);
debug('', 'ENV:'.grey, Matrix.env.blue, 'API:'.grey, Matrix.apiServer.blue, 'MXSS:'.grey, Matrix.streamingServer.blue);

var events = require('events');

//Event Loop - Handles all events. Not to be confused with Matrix.event, which is the namespace for event handlers

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




var mainFlowTimeout;
const mainFlowTimeoutSeconds = 30;


// This kicks off the launch, more code @see lib/service/launch.js
function mainFlow(cb) {
  if (mainFlowTimeout) clearTimeout(mainFlowTimeout);
  async.series([
    // Initialize event and service libraries. Calls module.export.init() if exists.
    function (cb) {
      Matrix.event.init();
      Matrix.service.init();
      cb();
    },
    checkLatestVersion,
    Matrix.service.launch.offlineCheck,
    Matrix.service.launch.onlineCheck,
  ], function (err) {
    if (err) {
      //If the error was caused by the network
      if (_.has(err, 'code') && networkErrors.indexOf(err.code) > -1) {
        if (!Matrix.service.launch.check.online) {
          console.error('Setup network error (such as timeout, interrupted connection or unreachable host) has occurred. Retrying in '.yellow + mainFlowTimeoutSeconds.toString().green + ' seconds.'.yellow);
        } else {
          console.log('Connectivity lost, reconnecting in '.yellow + mainFlowTimeoutSeconds.toString().green + ' seconds.'.yellow);
        }

        //Try again after a specific time has passed
        if (mainFlowTimeout) clearTimeout(mainFlowTimeout);
        mainFlowTimeout = setTimeout(function () {
          mainFlow(function (err) {
            if (!err) debug('The main flow worked after a retry!');
            else debug('The main flow keeps failing even after retrying...');
          });
        }, mainFlowTimeoutSeconds * 1000);
        Matrix.device.drivers.led.timedError(1, function () {
          if (!Matrix.ok.connected) Matrix.device.drivers.led.loader3();
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

// Call the Above
mainFlow(function (err) {
  if (!err) debug('MATRIX Launch Success!');
  else debug('The main flow is taking some time to get started...');
}); //Set the wheels in motion



/*
███    ███  █████  ████████ ██████  ██ ██   ██
████  ████ ██   ██    ██    ██   ██ ██  ██ ██
██ ████ ██ ███████    ██    ██████  ██   ███
██  ██  ██ ██   ██    ██    ██   ██ ██  ██ ██
██      ██ ██   ██    ██    ██   ██ ██ ██   ██
*/




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




function checkLatestVersion(cb) {


  const mosRepoURL = 'https://raw.githubusercontent.com/matrix-io/matrix-os/master/package.json';

  //Send the actual request
  require('request').get(mosRepoURL, function (err, resp, body) {
    if (err) return console.error(err);

    try {
      Matrix.latestVersion = JSON.parse(body).version;
      Matrix.version = JSON.parse(fs.readFileSync(__dirname + '/package.json')).version;
      Matrix.ok.current = (Matrix.latestVersion === Matrix.version)
    } catch (error) {
      console.error('Unable to parse MATRIX OS version info:', error.message);
    }

    cb();

  });
}
