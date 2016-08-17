var yaml = require('js-yaml')
var fs = require('fs')
var debug = debugLog('Application')
var configHelper = require('matrix-app-config-helper')


// An Application is a local instance of an application, mostly used to manage configuration and firebase
function Application(name, cb){
  debug(name.blue, 'new Instance')
  var self = this;
  var fb = Matrix.service.firebase;

  self.name = name;
  self.config = {};


  // upload a configuration, or use the local one
  self.syncConfig = function(config, cb){
    debug(self.name.blue, '['+self.appId.grey+']', 'Sync Config')
    if ( _.isUndefined(self.appId)){
      return console.error('No appId defined for syncConfig');
    }

    // todo: check for validation
    if ( config.validated === true && self.name === config.name ){
      if (_.isObject(config) || !_.isFunction(config)){
        // if config sent, update fb, event will populate file change
        saveAppConfig(self.appId, config, cb);
        self.config = config;
      } else {
        cb = config;
        // no obj sent - send local
        saveAppConfig(self.appId, self.config, cb);
      }
    } else {
      // errors and revalidate
      if ( self.name !== config.name ){
        console.error(self.name,' does not match file config name '.red, config.name)
      } else {
        debug('Validating configuration in syncConfig');
        var theConfig = configHelper.validate(config);
        if ( theConfig === false ){
          console.error('Config is not valid for sync', config)
        } else {
          debug('Resyncing Configuration...', self.name, config)
          self.syncConfig( theConfig, cb );
        }
      }
    }
  };

  // check firebase, or use local file
  self.getConfig = function(cb){
    debug(name.blue, '(fb)->(config)')
    // to recieve the configuration
    fb.app.get( self.appId, function(err, resp){
      debug("FB Config >>>> ".green, resp );
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
          if (self.config === false){
            console.warn('Invalid Configuration from Firebase. File Fallback.', resp);
            // if bad config in firebase, refresh from file and validate
            var fileConfig = self.getConfigFromFile();
            self.config = configHelper.validate(fileConfig);

            if (self.config === false){
              if ( _.isFunction(cb)){
                return cb(new Error('Invalid File Configuration '+resp) );
              } else {
                return console.error('Invalid File Configuration ',resp)
              }
            }
            // save to firebase
            debug('valid file config')
            self.syncConfig( self.config, function(err){
              if (err) console.error(err);
              if ( _.isFunction(cb)){
                cb(err, self.config)
              }
            })
          }
        }
      }

      if ( _.isFunction(cb)){
        cb(null, self.config);
      }
    })
  }

  self.initCV = function(){
    Matrix.service.ves.spawn()
  }

  self.validateConfig = function(config){
    if (config.name !== self.name){
      return new Error('Configuration name needs to match application name.')
    }
  }

  self.writeConfigFile = function(){
    writeAppConfigFile(self.name, self.config);
  }

  self.getConfigFromFile = function(){
    var configFile = './apps/' + self.name + '.matrix/config.yaml';
    var config = configHelper.read(configFile);
    debug('(file)->(config)', self.name, config)


    config = configHelper.validate(config);

    // save molested version to FB
    saveAppConfig(self.appId, config);

    return config;
  }

  self.clearConfig = function(){
    fb.app.set( self.appId, {});
  }

  self.watchForUpdates = function(){
    fb.app.onChange(self.appId, function(){
      // refresh config
      // todo: set callback
      self.getConfig();
    })
  }

  function init(cb){
    fb.app.getIDForName(self.name, function(err, appId){
      if (err) return console.error(err);
      debug(self.name, 'id=>', appId)

      self.appId = appId
    self.getConfig(appId, function(err, config){
      if (err) return console.error(err);

      debug('config=>', config)
      self.config = config;
      // if no fb record, default to file
      self.sensors = config.sensors;
      cb();
    });
  })

    // self.watchForUpdates();
  }

  init(cb);

  return self;
}


function saveAppConfig(appId, config, cb){
  debug('(config)->[FB]', appId.blue)
  var fb = Matrix.service.firebase;

  fb.app.setConfig(appId, config, cb);
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
