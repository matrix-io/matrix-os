
var Logger = require('le_node');
var log = Logger({
  token:'69c24d93-3677-47d6-954c-984d58932924'
});

_ = require('lodash');

log.info(Matrix);

var events = require('events');

// Core
Matrix = require('./lib');
//Event Loop
Matrix.events = new events.EventEmitter();

Matrix.config = require('./config');
//Deal with users

// Example
/*
Matrix.events.on('poop', function(data){
  log('iPooped!',data);
});

Matrix.events.emit('poop', { stinky: true });
*/

Matrix.activeUser = false;
Matrix.activeDevice = false;


module.exports = { Matrix: Matrix }