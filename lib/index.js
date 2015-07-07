var f = {};

  var files = require('fs').readdirSync('lib');

  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);

  files.forEach(function(file) {
    f[file] = require('./' + file);
  });

  module.exports = f;
