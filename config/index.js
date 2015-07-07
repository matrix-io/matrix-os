

module.exports = {
  url: require('./url')
}

var f = {};
var fs = require('fs');

  var files = fs.readdirSync('./config');

  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);

  files.forEach(function(file) {
    // require localized to this file
    if ( fs.statSync('./config/'+file).isFile() ){
      f[file.slice(0,-3)] = require('./' + file);
    }
  });

  f.local = require('./env');
  f.version = JSON.parse(fs.readFileSync('package.json')).version;

  module.exports = f;
