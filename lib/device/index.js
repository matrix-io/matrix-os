/* Everything having to do with the computer */

var debug = debugLog('device')
var f = {};

  var files = require('fs').readdirSync(__dirname);
  var drivers = require('fs').readdirSync(__dirname+'/drivers');

  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);

  _.remove(files, function(f){
    // remove invisibles and vim swaps
    return (f[0] === '.' || f.indexOf('.swp') > -1 || f === 'drivers')
  })

  files.forEach(function(file) {
    f[file.slice(0,-3)] = require('./' + file);
  });

  f.drivers = {};

  drivers.forEach(function(file) {
    f.drivers[file.slice(0,-3)] = require('./drivers/' + file);
    f.drivers[file.slice(0,-3)].name = file.slice(0,-3);

    debug('driver load:', file.slice(0, -3));
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
