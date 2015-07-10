
var Logger = require('le_node');
var log = new Logger({
  token:'69c24d93-3677-47d6-954c-984d58932924'
});

log = console.log;

require('colors');

_ = require('lodash');

var fs = require('fs');
var events = require('events');

// Core
Matrix = require('./lib');
//Event Loop
Matrix.events = new events.EventEmitter();

Matrix.config = require('./config');
config = Matrix.config;
Matrix.state = {};
//Deal with users

// Example
/*
Matrix.events.on('poop', function(data){
  log('iPooped!',data);
});

Matrix.events.emit('poop', { stinky: true });
*/


api = require('admatrix-node-sdk');

console.log(__dirname + '/config/_state.json');
if ( fs.existsSync(__dirname + '/config/_state.json') ){
  log('Using Old State');
  Matrix.state = Matrix.service.keepState.get();
} else {
  log('No prior state, run init()');
}


var init = function(){

  //TODO: Init All event code
  Matrix.event.api.init();

  var options = api.defaultConfig;
  api.start( options, function(err, state){
    if (err) console.trace( err.toString().red);
    console.log('Client Access Token', state);
    Matrix.service.keepState.set(state);
    Matrix.state = state;
    Matrix.events.emit('api-connect', state);
  });
}

console.log('========== vvv API vvv =========\n'.blue, api, "\n======== ^^^ API ^^^ =======".blue);




Matrix.activeUser = false;
Matrix.activeDevice = false;


console.log('========== vvv MATRIX vvv =========\n'.yellow, Matrix, "\n======== ^^^ MATRIX ^^^ =======".yellow);
module.exports =
{
  Matrix: Matrix,
  init: init
}