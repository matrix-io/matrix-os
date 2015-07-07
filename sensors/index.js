var f = {};

  var files = require('fs').readdirSync('.');

  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);

  files.forEach(function(file) {
    // require localized to this file
    f[file.slice(0, -3)] = require('./' + file);
  });
