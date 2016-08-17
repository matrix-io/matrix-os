//* The server we're running
//
var debug = debugLog('matrix');
var f = {
  init: function(){
    files.forEach(function(file){
      debug(file.slice(0, -3), 'event listener init');
      f[file.slice(0,-3)].init();
    });
  }
};


var files = require('fs').readdirSync(__dirname);

  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);

  _.remove(files, function(f){
    // remove invisibles and vim swaps
    return (f[0] === '.' || f.indexOf('.swp') > -1)
  })

  files.forEach(function(file) {
    f[file.slice(0,-3)] = require('./' + file);
  });

  f.init = function(){
    for (var i in f){
      if( f[i].init ){
        f[i].init();
        debug('event listener:'.blue, i);
      }
    }
  }

  module.exports = f;
