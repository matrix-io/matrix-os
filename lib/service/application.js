var yaml = require('js-yaml')
var fs = require('fs')
var debug = debugLog('Application')
var configHelper = require('matrix-app-config-helper')


// An Application is a local instance of an application, mostly used to manage configuration
function Application(name, cb){
  debug(name.blue, 'new Instance')
  var self = this;
  var fb = Matrix.service.firebase;

  self.name = name;
  self.config = {};

  

  self.syncConfig = function(config, cb){
    debug(self.name.blue, 'Sync Config')
    var name = self.name;
    if (_.isObject(config) || !_.isFunction(config)){
      // if config sent, update fb, event will populate file change
      saveAppConfig(name, config, cb);
      self.config = config;
    } else {
      cb = config;
      // no obj sent - send local
      saveAppConfig(name, self.config, cb);
    }
  };

  self.getConfig = function(cb){
    debug(name.blue, '(fb)->(config)')
    // to recieve the configuration
    fb.app.get( name, function(err, resp){
      // debug("FB Config >>>> ".green, resp );
      if (err) return cb(err);
      if ( _.isNull(resp)){
        debug('FB Config Null. Fallback to file.')
        // no record in FB. read local?
        self.config = self.getConfigFromFile();
      } else {
        debug('Using FB Config')
        if ( resp.validated ){
          console.warn('FB Configuration Has Validation')
          self.config = resp;
        } else {
          // populate config
          self.config = configHelper.validate(resp);
        }
      }

      if ( _.isFunction(cb)){
        cb(null, self.config);
      }
    })
  }

  self.initCV = function(name, options){
    Matrix.service.ves.spawn()
  }

  self.validateConfig = function(config){
    if (config.name !== self.name){
      return new Error('Configuration name needs to match application name.')
    }
  }

  self.writeConfigFile = function(cb){
    writeAppConfigFile(self.name, self.config);
  }

  self.getConfigFromFile = function(){
    debug('(file)->(config)', self.name)
    var configFile = './apps/' + self.name + '.matrix/config.yaml';
    var config = configHelper.read(configFile);


    config = configHelper.validate(config);

    // save molested version to FB
    saveAppConfig(self.name, config);

    return config;
  }

  self.clearConfig = function(){
    fb.app.set( self.name, {});
  }

  self.watchForUpdates = function(){
    fb.app.onChange(self.name, function(){
      // refresh config
      self.getConfig();
    })
  }

  function init(cb){
    self.getConfig( function(err, config){
      self.config = config;
      // if no fb record, default to file
      self.sensors = config.sensors;
      cb();
    });

    // self.watchForUpdates();
  }

  init(cb);

  return self;
}


function saveAppConfig(name, config, cb){
  debug('(config)->[FB]', name.blue)
  var fb = Matrix.service.firebase;

  fb.app.set(name, config);

  if (_.isFunction(cb)){
    cb()
  }
}

function writeAppConfigFile(name, config){

  var configFile = './apps/' + options.name + '.matrix/config.yaml';
  config = yaml.safeDump(config);
  fs.writeFile(configFile, cb);
}


//TODO: should support all the config tree, not just configuration
function updateConfigKey(options, cb) {

  var fb = Matrix.service.firebase;

  var configFile = './apps/' + options.name + '.matrix/config.yaml';
  var config = yaml.loadSafe(fs.readFileSync(configFile));
  if ( config.hasOwnProperty('configuration')){
    console.warn('`configuration` in app config', options)
    config.configuration[options.key] = options.value;
  } else {
    config.settings[options.key] = options.value;
  }
  var configJs = yaml.safeDump(config);
  fs.writeFile(configFile, configJs, cb);
}

module.exports =  {
  Application: Application,
  updateConfigKey: updateConfigKey,
  writeAppConfigFile: writeAppConfigFile,
  saveAppConfig: saveAppConfig
}
