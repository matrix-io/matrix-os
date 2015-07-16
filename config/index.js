

module.exports = {
  url: require('./url')
}

var f = {};
var fs = require('fs');

  var files = fs.readdirSync(__dirname);

  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);
  files.splice(files.indexOf('store.db'), 1);
  files.splice(files.indexOf('api-store.db'), 1);

  files.forEach(function(file) {
    // require localized to this file
    if ( fs.statSync(__dirname+'/'+file).isFile() ){
      f[file.slice(0,-3)] = require('./' + file);
    }
  });

  f.local = require('./env');
  f.version = JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version;
  f.heartbeatInterval = 10000;

  module.exports = f;
