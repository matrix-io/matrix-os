//* The server we're running
//
var f = {};

var debug = debugLog('matrix');

  var files = require('fs').readdirSync(__dirname).filter(function(f){ return ( f.indexOf('.js') > -1 ) } );;

  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);

  files.forEach(function(file) {
    f[file.slice(0,-3)] = require('./' + file);
    debug('service ready:'.blue, file.slice(0,-3) );
  });


  f.init = function(){
    for (var i in f){
      if( f[i].init && i !== 'firebase' ){
        f[i].init();
        debug('service init:'.blue, i);
      }
    }
  }

  module.exports = f;
