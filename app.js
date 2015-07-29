
// var Logger = require('le_node');
// var log = new Logger({
//   token:'69c24d93-3677-47d6-954c-984d58932924'
// });




_ = require('lodash');

var fs = require('fs');
var events = require('events');
var util = require('util');
ulog = util.log;
clog = console.log;


// Core
Matrix = require('./lib');

Matrix.service.logging.init();

Matrix.config = require('./config');
config = Matrix.config;

//Event Loop
Matrix.events = new events.EventEmitter();

//Initialize Listeners
Matrix.event.init();

// SDK
api = require('admatrix-node-sdk');
api.makeUrls( process.env['ADMATRIX_API'] || api.defaultConfig.apiUrl );
Matrix.api = api;

//app processes
Matrix.activeProcesses = [];

//db -
var DataStore = require('nedb');
Matrix.db = new DataStore({ filename: './db/store.db', autoload: true });

Matrix.service.token.get(function(err, token){
  if (err) return console.error(err);
  if (_.isNull(token)) {
    console.error('Please Login with ./bin/adm start. No Token Available'.red);
  } else {
    // log('Token Loaded'.green, token);
    Matrix.token = token;
    api.setToken(token);
  }
});

Matrix.service.lifecycle.updateLastBootTime();
Matrix.service.socket.init();

// TODO: Enable Configurations
// Start Apps - Hit API Server for App List (needs endpoint)
// > Start App. Sensors
// Scaffold for Install / Remove
// Scaffold for Updates - socket > tmp + migrate & fallback
// Start BTLE
// WiFI connection



// Init Services
Matrix.service = require('./lib/service');

//make sensors available
Matrix.sensors = require('./sensors');


// Start an app - FAKE
Matrix.service.manager.start('temperature');
Matrix.sensors.fake.init(8000);


//
// mainLogger.info('woo');
// warn = debugLogger.error;
//

// log = clog.info;
// warn = clog.warn;
// error = clog.error;
//



//Deal with users

// Example
/*
Matrix.events.on('poop', function(data){
  log('iPooped!',data);
});

Matrix.events.emit('poop', { stinky: true });
*/


var authenticate = function(cb){
  // Matrix.event.api.init();

  //override with passed params
  //TODO: read env for options
  var options = _.extend(api.defaultConfig, options);
  api.authenticate( options, function(err, state){
    if (err) return cb(err);
    console.log('Client Access Token', state.client.token);
    Matrix.service.token.set(state.client.token, function(err, resp){
      console.log('Token Set', resp, err );
    });
    Matrix.state = state;
    cb(err, state);
  });
}

Matrix.activeUser = false;
Matrix.activeDevice = false;


// console.log('========== vvv API vvv =========\n'.blue, api, "\n======== ^^^ API ^^^ =======".blue);
// console.log('========== vvv MATRIX vvv =========\n'.yellow, Matrix, "\n======== ^^^ MATRIX ^^^ =======".yellow);
module.exports =
{
  Matrix: Matrix,
  auth: authenticate
}

process.on('SIGINT', function() {
  console.log('worker %d cancelled (%s). restarting...');
  Matrix.service.manager.clearList();
  process.exit(1);
});

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});
