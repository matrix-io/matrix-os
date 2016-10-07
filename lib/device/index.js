/* Everything having to do with the computer */

var debug = debugLog('device')
var f = {};

// only look at .js files
  var files = require('fs').readdirSync(__dirname).filter(function(f){ return ( f.indexOf('.js') > -1 ) } );
  var drivers = require('fs').readdirSync(__dirname+'/drivers').filter(function(f){ return ( f.indexOf('.js') > -1 ) } );



  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);

  files.forEach(function(file) {
    debug('Loading...  device > ' + file.slice(0,-3))
    f[file.slice(0,-3)] = require('./' + file);
  });

  f.drivers = {};

  drivers.forEach(function(file) {
    debug('Loading...  device > driver > ' + file.slice(0,-3))
    f.drivers[file.slice(0,-3)] = require('./drivers/' + file);
    f.drivers[file.slice(0,-3)].name = file.slice(0,-3);
  });

  f.init = function(){

    for (var i in f){
      if( f[i].init ){
        f[i].init();
        debug('device init:'.blue, i);
      }
    }

    for (i in f.drivers){
      if (f.drivers[i].init){
        f.drivers[i].init();
        debug('driver init:'.blue, i );
      }
    }
  }

  module.exports = f;
