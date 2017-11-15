/**
 * Matrix.event is to support all the event handlers,
 */

//* The server we're running
//
var debug = debugLog('matrix');
var f = {};

// only do files that end in .js
var files = require('fs').readdirSync(__dirname).filter(function (f) { return (f.indexOf('.js') === f.length - 3) });

//remove self
files.splice(files.indexOf(require('path').basename(__filename)), 1);

files.forEach(function (file) {
  debug('Loading...  event > ' + file.slice(0, -3))
  f[file.slice(0, -3)] = require('./' + file);
});

// expose this to fire off the event listeners after everything is loaded
f.init = function () {
  for (var i in f) {
    if (f[i].init) {
      f[i].init();
      debug('event listener:'.blue, i);
    }
  }
}

module.exports = f;
