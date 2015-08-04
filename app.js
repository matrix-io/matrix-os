
_ = require('lodash');
async = require('async');

var fs = require('fs');
var events = require('events');
var util = require('util');

// Core
Matrix = require('./lib');

// Logging
Matrix.service.logging.init();
ulog = util.log;
clog = console.log;

// SDK
api = require('admatrix-node-sdk');
api.makeUrls( process.env['ADMATRIX_API'] );

// Config
Matrix.config = require('./config');
config = Matrix.config;

//Event Loop - Handles all events
Matrix.events = new events.EventEmitter();

//Initialize Listeners - Code goes here
Matrix.event.init();

Matrix.api = api;
Matrix.api.makeUrls(Matrix.apiServer);

//app processes
Matrix.activeProcesses = [];

//db -
var DataStore = require('nedb');
Matrix.db = {
  config : new DataStore({ filename: config.path.db.config, autoload: true }),
  device : new DataStore({ filename: config.path.db.device, autoload: true }),
  user : new DataStore({ filename: config.path.db.user, autoload: true }),
  service : new DataStore({ filename: config.path.db.service, autoload: true }),
  pending : new DataStore({ filename: config.path.db.pending, autoload: true })
}

// this is kind of an init
async.series([
  function checkApiServer(cb){
    require('http').get(Matrix.apiServer, function(res){
      cb(null);
    }).on('error', function(){
      error('No API Server Visible', Matrix.apiServer);
      cb();
    });
  },
  function checkStreamingServer(cb){
    require('http').get(Matrix.streamingServer, function(res){
      cb(null);
    }).on('error', function(){
      error('No Streaming Server Visible', Matrix.streamingServer)
      cb();
    });
  },
  function getToken(cb){
    // check in with api server
    Matrix.service.token.get(function(err, token){
      if (err) return cb(err);

      log('Using Token'.green, token);
      Matrix.token = token;
      cb(null);
    });
  },
  function checkUpdates(cb){
    warn('Updates not implemented on api yet');
    Matrix.api.device.checkUpdates(function(err, update){
      if (err) return cb(err);
      // check version
      log('===', err, update);
      if ( update.version === Matrix.version ){
        cb(null);
      } else {
        cb(null);
      }
    });
  }
], function(err, obj){
  if (err) error(err);
  log('=<[^\\/^]>='.green.bold, '['.green+Matrix.deviceId.green+']'.green, 'Ready to go');
});

Matrix.service.lifecycle.updateLastBootTime();
Matrix.service.stream.init();

// TODO: Enable Configurations
// Start Apps - Hit API Server for App List (needs endpoint)
// > Start App. Sensors
// Scaffold for Install / Remove
// Scaffold for Updates - socket > tmp + migrate & fallback
// Start BTLE
// WiFI connection



//make sensors available
Matrix.sensors = require('./sensors');


if (config.fakeSensor === true){
// Start an app - FAKE
Matrix.service.manager.start('temperature');
// Start a sensor -- FAKE
Matrix.sensors.fake.init(8000);
}




//Deal with users

// Example
/*
Matrix.events.on('poop', function(data){
  log('iPooped!',data);
});

Matrix.events.emit('poop', { stinky: true });
*/


// log('========== vvv API vvv =========\n'.blue, api, "\n======== ^^^ API ^^^ =======".blue);
// console.log('========== vvv MATRIX vvv =========\n'.yellow, Matrix, "\n======== ^^^ MATRIX ^^^ =======".yellow);
module.exports =
{
  Matrix: Matrix
}


//Triggered when the application is killed by a [CRTL+C] from keyboard
process.on("SIGINT", function () {
  log("Matrix -- CRTL+C kill detected");
  onKill();
});

//Triggered when the application is killed with a -15
process.on("SIGTERM", function () {
  log("Matrix -- Kill detected");
  onKill();
});

//Triggered when the application is killed by a [CRTL+\] from keyboard
process.on("SIGQUIT", function () {
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
  // clean up db
  // kill children apps
  // other maintenance
  process.exit();
}



//Triggered when an unexpected (programming) error occurs
//Also called when a DNS error is presented
process.on('uncaughtException', function (err) {
  error('Boot -- Uncaught exception: ');
  if (err.code && err.code == "ENOTFOUND") {
    error('Boot -- ENOTFOUND was detected (DNS error)');
    Matrix.device.manager.setupDNS();
  } else if (err.code && err.code == "EAFNOSUPPORT") {
    error('Boot -- EAFNOSUPPORT was detected (DNS error 2?)');
    Matrix.device.manager.setupDNS();
  } else if (err.code && err.code == "ETIMEDOUT") {
    error('Boot -- ETIMEDOUT was detected (DNS error 3?)');
    Matrix.device.manager.setupDNS();
  } else if (err.code && err.code == "ENOMEM") {
    error('Boot -- ENOMEM was detected (Out of memory)');
    error(err.stack);
    Matrix.device.manager.reboot("Memory clean up");
  } else {
    error(err.stack);

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
  }
});
