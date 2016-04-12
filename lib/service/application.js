
function Application(name){
  var self = this;
  var fb = Matrix.service.firebase;

  self.name = name;
  self.config = {};

  self.syncConfig = function(config){
    var name = self.name;
    if (_.isObject(config)){
      // if config sent, update fb, event will populate file change
      writeConfigToFirebase(config);
      self.config = config;
    } else {
      // no obj sent - send local
      writeConfigToFirebase(self.config);
    }
  };

  self.getConfig = function(cb){
    // to recieve the configuration
    fb.app.get(Matrix.userId, Matrix.deviceId, name, function(err, resp){
      if (err) return cb(err);
      console.log("Read Config >>>> ".green, resp);
      self.config = config;
      if ( _.isFunction(cb)){
        cb(null, config);
      }
    })
  }

  self.writeConfigFile = function(cb){
    writeAppConfigFile(self.name, self.config);
  }

  self.getConfigFromFile = function(){
    var configFile = './apps/' + self.name + '.matrix/config.yaml';
    var config = yaml.loadSafe(fs.readFileSync(configFile));
    self.config = config;
    return config;
  }

  self.clearConfig = function(){
    fb.app.set(Matrix.userId, Matrix.deviceId, self.name, {});
  }

  self.watchForUpdates = function(){
    log(Matrix.userId, Matrix.deviceId, self.name );
    fb.app.onChange(Matrix.userId, Matrix.deviceId, self.name, function(){
      // refresh config
      self.getConfig();
    })
  }

  function init(){
    self.getConfig( function(err, config){
      // if no fb record, default to file
      if (_.isEmpty(self.config)){
        self.getConfigFromFile();
      }
      // write to FB
      self.syncConfig();
    });

    self.watchForUpdates();
  }

  init();

  return self;
}


function saveAppConfig(name, config){
  var fb = Matrix.service.firebase;

  fb.app.set(Matrix.userId, Matrix.deviceId, name, config);
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
  config.configuration[options.key] = options.value;
  var configJs = yaml.safeDump(config);
  fs.writeFile(configFile, configJs, cb);
}

module.exports =  {
  Application: Application,
  updateConfigKey: updateConfigKey,
  writeAppConfigFile: writeAppConfigFile,
  saveAppConfig: saveAppConfig
}
