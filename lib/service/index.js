/**
 * index loads all files in service and makes their exports available on Matrix.service
 * Also calls init() if it exists on the service
 */
var f = {};

var debug = debugLog('matrix');

  // only do files that end in .js
  var files = require('fs').readdirSync(__dirname).filter(function(f){ return ( f.indexOf('.js') === f.length - 3 ) } );

  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);

  _.remove(files, function(f){
    // remove invisibles and vim swaps and firebase module
    return (f[0] === '.' || f.indexOf('.swp') > -1 )
  })

  files.forEach(function (file) {
    debug('Loading...  service > ' + file.slice(0, -3));
    f[file.slice(0, -3)] = require('./' + file);
  });

  f.init = function(){
    for (var i in f){
      // skips firebase init for until after tokens are available
      if( f[i].init && i !== 'firebase' ){
        f[i].init();
        debug('service init:'.blue, i);
      }
    }
  }

  module.exports = f;
