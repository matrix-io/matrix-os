var f = {
  fakeSensor: true,
  fakeFrequency: 30000
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
    'ADMATRIX_API_SERVER',
    'ADMATRIX_STREAMING_SERVER',
    'ADMATRIX_CLIENT_ID',
    'ADMATRIX_CLIENT_SECRET',
    'ADMATRIX_DEVICE_ID',
    'ADMATRIX_USER',
    'ADMATRIX_PASSWORD',
    'NODE_ENV'
  ]);

  configs = _.mapKeys(configs, function(v,k){
    var k = k.replace('ADMATRIX','');
    return _.camelCase(k);
  })

  clog('ENV VARS\n'.green, configs);

  _.extend(Matrix, configs);

  f.version = JSON.parse( fs.readFileSync('./package.json') ).version;

  f.local = require('./env');
  f.version = JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version;
  f.heartbeatInterval = 10000;
  f.spaceLimit = 5000000;
  f.splashInterval = 30;
  f.sensorRefresh = 100;


// TODO: Figure out where storage happens, shouldn't it just be nedb
  f.paths = { root : __dirname };

  module.exports = f;
