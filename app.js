
var Logger = require('le_node');
var log = new Logger({
  token:'69c24d93-3677-47d6-954c-984d58932924'
});

log = console.log;

var DataStore = require('nedb');


require('colors');

_ = require('lodash');

var fs = require('fs');
var events = require('events');

// Core
Matrix = require('./lib');

//db
Matrix.db = new DataStore({ filename: './config/store.db', autoload: true });
Matrix.service.state.get(function(err, state){
  if (err) return console.error(err);
  if (_.isNull(state)) {
    log('No State Saved');
  } else {
    Matrix.state = state;
  }
});

// SDK
api = require('admatrix-node-sdk');

api.makeUrls( process.env['ADMATRIX_API'] || api.defaultConfig.apiUrl );

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
//Deal with users

// Example
/*
Matrix.events.on('poop', function(data){
  log('iPooped!',data);
});

Matrix.events.emit('poop', { stinky: true });
*/

Matrix.event.init();

var authenticate = function(cb){
  // Matrix.event.api.init();

  //override with passed params
  //TODO: read env for options
  var options = _.extend(api.defaultConfig, options);
  api.authenticate( options, function(err, state){
    if (err) return cb(err);
    console.log('Client Access Token', state.client.token);
    Matrix.service.state.set(state);
    Matrix.state = state;
    Matrix.events.emit('api-connect', state);
    cb(err, state);
  });
}

console.log('========== vvv API vvv =========\n'.blue, api, "\n======== ^^^ API ^^^ =======".blue);




Matrix.activeUser = false;
Matrix.activeDevice = false;


console.log('========== vvv MATRIX vvv =========\n'.yellow, Matrix, "\n======== ^^^ MATRIX ^^^ =======".yellow);
module.exports =
{
  Matrix: Matrix,
  auth: authenticate
}
