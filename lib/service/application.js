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
  self.policy = {};


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
    debug(self.name.blue, '(fb)->(config)')
    if ( _.isUndefined(cb) ){ cb = _.noop; }
    // to recieve the configuration
    fb.app.getConfig( self.appId, function(err, resp){
      debug("FB Config >>>> ".green, resp );
      if (err) return cb(err);
      if ( _.isNull(resp)){
        debug('Fallback to file. No Policy / ID Available.')
        // no record in FB. read local?
        self.config = self.getConfigFromFile();


      } else {
        debug('Using FB Config')
        if ( resp.validated ){
          debug('FB Configuration Validated')
          self.config = resp;
          cb(err, self.config);
        } else {
          // populate config
          self.config = configHelper.validate(resp);
          if (self.config === false){
            console.warn('Invalid Configuration from Firebase. File Fallback.', resp);
            // if bad config in firebase, refresh from file and validate
            var fileConfig = self.getConfigFromFile();
            self.config = configHelper.validate(fileConfig);

            if (self.config === false){
              return cb(new Error('Invalid File Configuration '+resp) );
            }
            // save to firebase
            debug('valid file config')
            self.syncConfig( self.config, function(err){
              if (err) console.error(err);
                cb(err, self.config)
            })
          } else {
            console.warn('firebase config valid, but not validated, check flow')
            cb(null, self.config);
          }
        }
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
    console.warn('apps do not watch for config updates yet')
    // fb.app.onChange(self.appId, function(){
    // })
  }

  function init(cb){
    debug('init:',self.name)

    fb.app.getIDForName(self.name, function(err, appId){
      if (err) return console.error(err);

      debug('id=>', appId);
      // firebase requires appId for each call, don't pass to private methods
      self.appId = appId;

      async.parallel([
        function config(cba){
          self.getConfig(function(err, config){
            if (err) cba(err);

            debug('config=>', config)
            self.config = config;

            self.detections = _.map(config.services, function(s){
              if ( _.has(s, 'engine' )) {
                return { detection: s.engine };
              }
            })

            cba();
          });
        },
        function policy(cba){
          fb.app.getPolicy(self.appId, function(err, policy){
            if (err) cba(err);

            debug('policy=>', policy);
            self.policy = policy || {};
            // if no fb record, default to file
            self.sensors =  _.keys( _.pick( self.policy.sensors, function(v){ return v }));
            self.integrations =  _.keys( _.pick( self.policy.integrations, function(v){ return v }));
            self.services =  _.keys( _.pick( self.policy.services, function(v){ return v }));
            self.crosstalk =  _.keys( _.pick( self.policy.crosstalk, function(v){ return v }));
            cba();
          });
        }
      ], function(err){
        cb(err);
      });
    })

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

function updateConfigKey(options, cb) {
  var configFile = './apps/' + options.name + '.matrix/config.yaml';
  var config = yaml.loadSafe(fs.readFileSync(configFile));
  if ( config.hasOwnProperty('configuration')){
    //FIXME: Depreciate this path
    console.warn('`configuration` in app config', options)
    config.configuration[options.key] = options.value;
  } else {
    // this is the newness
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
