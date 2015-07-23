
// var Logger = require('le_node');
// var log = new Logger({
//   token:'69c24d93-3677-47d6-954c-984d58932924'
// });

var DataStore = require('nedb');



_ = require('lodash');

var fs = require('fs');
var events = require('events');

// Core
Matrix = require('./lib');

// SDK
api = require('admatrix-node-sdk');
api.makeUrls( process.env['ADMATRIX_API'] || api.defaultConfig.apiUrl );

//app processes
Matrix.activeProcesses = [];


//db
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


Matrix.api = api;

//Event Loop
Matrix.events = new events.EventEmitter();

//Initialize Listeners
Matrix.event.init();

// Init Services
Matrix.service = require('./lib/service');

//make sensors available
Matrix.sensors = require('./sensors');

Matrix.config = require('./config');
config = Matrix.config;

// Logging
winston = require('winston');
var Logentries = require('winston-logentries');


  var clog = new(winston.Logger)({
    transports: [
      new(winston.transports.Console)({
        colorize: true
      }),
      // new(winston.transports.File)({
      //   filename: 'somefile.log'
      // }),
      new(winston.transports.Logentries)({
        token: 'b80a0207-e6d3-4aef-a7cf-4a787ca7ab41'
      })
    ]
  });

if ( _.isString(process.env['ADMATRIX_DEVICE_ID'])) {
  clog.addFilter(function(msg, meta, level) {
    return msg + ' [' + process.env['ADMATRIX_DEVICE_ID'] + ']';
  });
}


  log = clog.info;
  warn = clog.warn;
  error = clog.error;

//
// mainLogger.info('woo');
// warn = debugLogger.error;
//

// log = clog.info;
// warn = clog.warn;
// error = clog.error;
//
log('pooped');
warn('pooped');
error('pooped2');


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
