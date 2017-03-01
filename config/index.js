var f = {
  fakeApp:  process.env['START_APP']
};
var fs = require('fs');

var files = fs.readdirSync(__dirname);

//remove self
files.splice(files.indexOf(require('path').basename(__filename)), 1);
// files.splice(files.indexOf('store.db'), 1);
// files.splice(files.indexOf('api-store.db'), 1);

files.forEach(function(file) {
  // require localized to this file
  if ( fs.statSync(__dirname+'/'+file).isFile() ){
    f[file.slice(0,-3)] = require('./' + file);
  }
});





var configs = _.pick(process.env, [
  // 'ADMATRIX_API_SERVER',
  // 'ADMATRIX_STREAMING_SERVER',
  // 'ADMATRIX_CLIENT_ID',
  // 'ADMATRIX_CLIENT_SECRET',
  // 'ADMATRIX_DEVICE_ID',
  // 'ADMATRIX_DEVICE_NAME',
  // 'ADMATRIX_USER',
  // 'ADMATRIX_PASSWORD',
  // // support matrix too, prioritize these
  // 'MATRIX_API_SERVER',
  // 'MATRIX_STREAMING_SERVER',
  'MATRIX_CLIENT_ID',
  'MATRIX_DEVICE_SECRET',
  'MATRIX_DEVICE_ID',
  'MATRIX_DEVICE_NAME',
  'NODE_ENV'
]);

configs = _.mapKeys(configs, function(v,k){
  var k = k.replace('ADMATRIX','').replace('MATRIX','');
  return _.camelCase(k);
})
// 
// debug('ENVS >>>>'.blue, configs);

_.extend(Matrix, configs);


f.jwt = { secret : process.env.JWT_SECRET }

f.version = JSON.parse( fs.readFileSync(__dirname + '/../package.json') ).version;

f.local = require('./env');
f.version = JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version;
f.heartbeatInterval = 10000;
f.spaceLimit = 5000000;
f.splashInterval = 30;
f.sensorRefresh = process.env['MATRIX_SENSOR_REFRESH'] || 2500;
// not in yet
f.sensorSockets = true;
f.socketCheckDelay = 60000;
f.registrationUUID = "b1a6752152eb4d36e13e357d7c225466";
f.configurationUUID = "b1a6752152eb4d36e13e357d7c225467";
f.envs = configs;

// for device component info
f.components = {};


// TODO: Figure out where file storage happens
f.paths = { root : __dirname };

module.exports = f;
