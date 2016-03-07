
var e = {};
var debug = debugLog('matrix');
var _ = require('lodash');

var files = require('fs').readdirSync(__dirname);

var validFiles = files;

files = _.filter(files, function(file){
  return ( file.substr(0,file.length-3) === process.env['NODE_ENV'] );
});

if ( files.length === 0 ){
  debug('NODE_ENV not valid, assuming production', 'valid names', validFiles );
  process.env['NODE_ENV'] = 'production';
  files = ['production'];
}

var envFile = files[0].replace('.js','')

e = require( __dirname + '/' + envFile + '.js');

module.exports = e;
