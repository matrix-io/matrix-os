//* The server we're running
//
var f = {};

var debug = debugLog('matrix');

  var files = require('fs').readdirSync(__dirname);

  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);

  files.forEach(function(file) {
    f[file.slice(0,-3)] = require('./' + file);
    debug('service ready:'.blue, file.slice(0,-3) );
  });

  module.exports = f;
