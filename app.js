
var Logger = require('le_node');
var log = new Logger({
  token:'69c24d93-3677-47d6-954c-984d58932924'
});

_ = require('lodash');


var events = require('events');

// Core
Matrix = require('./lib');
//Event Loop
Matrix.events = new events.EventEmitter();

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

Matrix.activeUser = false;
Matrix.activeDevice = false;


console.log(Matrix);
module.exports = { Matrix: Matrix }