
var e = {};
var debug = debugLog('matrix');
var _ = require('lodash');

var files = require('fs').readdirSync('.');

files = _.filter(files, function(file){
  return ( file == process.env['NODE_ENV'] );
});

if ( files.length === 0 ){
  debug('NODE_ENV not set, assuming production');
  process.env['NODE_ENV'] = 'production';
  files = ['production'];
}

e = require('./' + files[0]);

module.exports = e;
