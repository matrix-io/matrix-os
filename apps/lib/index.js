/* Everything having to do with the computer */

var f = {};
var files = require('fs').readdirSync(__dirname);

//remove self
files.splice(files.indexOf(require('path').basename(__filename)), 1);

files.forEach(function(file) {
  f[file.slice(0,-3)] = require('./' + file);
});

module.exports = f;