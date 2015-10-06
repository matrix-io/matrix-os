/* GLOBALS */
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
api.makeUrls( process.env['ADMATRIX_API_SERVER'] );

// Config
Matrix.config = require('./config');
config = Matrix.config;

//Event Loop - Handles all events
Matrix.events = new events.EventEmitter();
Matrix.events.on('addListener', function(name){ log (name);})

//Initialize Listeners - Code goes here
Matrix.event.init();

// Node-SDK - Use for API Server Communication
Matrix.api = api;
Matrix.api.makeUrls(Matrix.apiServer);

//app processes, see lib/service/mananger
Matrix.activeProcesses = [];

//db - files stored in db
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
  function getToken(cb){
    // check in with api server
    Matrix.service.token.get(function(err, token){
      if (err) return cb(err);
      Matrix.token = token.clientToken;
      Matrix.clientToken = token.clientToken;
      Matrix.deviceToken = token.deviceToken;
      log('Client Token'.green, token.clientToken);
      cb(null);
    });
  },
  function checkUpdates(cb){
    // warn('Updates not implemented on api yet');
    return cb();
    Matrix.api.device.checkUpdates(function(err, update){
      if (err) return cb(err);
      // check version
      if ( update.version === Matrix.version ){
        cb(null);
      } else {
        cb(null);
      }
    });
  },
  Matrix.service.stream.checkStreamingServer,
], function(err, obj){
  if (err) error(err);
  log(Matrix.is.green.bold, '['.grey+Matrix.deviceId.grey+']'.grey, 'ready'.yellow.bold);
  Matrix.banner();
});




Matrix.service.lifecycle.updateLastBootTime();


if (config.fakeApp){
// Start an app - FAKE
Matrix.service.manager.start(config.fakeApp);
// Matrix.service.manager.start('test-event');
// Start a sensor -- FAKE
// Matrix.sensors.fake.openSocket(8000);
//
// Matrix.sensors.fake.start(function(err, d){
//   console.log('wow', d)
// });
  // Matrix.service.manager.start('monitor');

} else {
  //3 apps in parallel
  // Matrix.service.manager.start('accel');
  // Matrix.service.manager.start('neo');
}

// These are helpful when debugging
// log('========== vvv API vvv =========\n'.blue, api, "\n======== ^^^ API ^^^ =======".blue);
// log('========== vvv MATRIX vvv =========\n'.yellow, Matrix, "\n======== ^^^ MATRIX ^^^ =======".yellow);


module.exports =
{
  Matrix: Matrix
}

// Process Level Event Listeners

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
  Matrix.service.stream.close();
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
  error('Matrix -- Uncaught exception: ', err, err.stack);
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
  process.exit();
});
