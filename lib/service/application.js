
var yaml = require('js-yaml');
var fs = require('fs');
var debug = debugLog('Application');
var configHelper = require('matrix-app-config-helper');



/**
 * Application is a class to make applications.
 * @constructor
 * @param {string}   name - App name
 * @param {function} cb   - Callback when Init is done
 *
 * @property { string } name - app name
 * @property { object } config - application configuration
 * @property { object } policy - runtime policy
 *
 * @method setRuntimeStatus - set to 'active', 'inactive' or 'error'
 * @method 
 * // used?clearConfig - remove firebase configuration
 * @method validateConfig - make sure configuration is valid
 *
 * @todo @method activate - communicate with activeApplications
 * @todo @method deactivate - communicate with activeApplications
 * @todo @method start - start app process
 * @todo @method stop - stop app process
 *
 * @summary
 * After creation, applications do the following (see init below):
 *   - Fetch configuration from firebase
 *   - -or if none- upload config.yaml
 *   - setRuntime to 'active'
 *
 * @author Sean Canton <sean.canton@admobilize.com>
 *
 */


function Application(name, cb) {
  debug(name.blue, 'new Instance');
  var self = this;
  var fb = Matrix.service.firebase;

  self.name = name;
  // config stores the contents of config.yaml
  self.config = {};
  // stores the policy object as nested objects and bools
  // ex. policy = { sensors : {temperature: true}}
  self.policy = {};

  // set app status on firebase, used on install / deploy / start / stop / error
  self.setRuntimeStatus = function (status) {
    if (self.hasOwnProperty('appId') && !_.isUndefined(self.appId) && !_.isUndefined(status)) {
      fb.app.setStatus(self.appId, status);
      if (status === 'active') {
        fb.app.setOnline(self.appId, true);
      } else {
        fb.app.setOnline(self.appId, false);
      }
    } else {
      console.log('Runtime status update error');
    }
  };


  // upload a configuration, or use the local one
  self.syncConfig = function (config, cb) {
    debug(self.name.blue, '[' + self.appId.grey + ']', 'Sync Config');
    if (_.isUndefined(self.appId)) {
      return console.error('No appId defined for syncConfig');
    }

    // todo: check for validation
    if (config.validated === true && self.name === config.name) {
      if (_.isObject(config) || !_.isFunction(config)) {

        // if config sent, update fb, event will populate file change
        saveAppConfig(self.appId, config, cb);
        self.config = config;
      } else {
        cb = config;
        // no config from fb - send local
        saveAppConfig(self.appId, self.config, cb);
      }
    } else {
      // errors and revalidate
      if (self.name !== config.name) {
        console.error(self.name, ' does not match file config name '.red, config.name);
      } else {
        debug('Validating configuration in syncConfig');
        var theConfig = configHelper.validate(config);
        if (theConfig === false) {
          console.error('Config is not valid for sync', config);
        } else {
          debug('Resyncing Configuration...', self.name, config);
          self.syncConfig(theConfig, cb);
        }
      }
    }
  };

  // check firebase, or use local file
  // default is to use firebase, and if it doesn't exist, use config.json
  self.getConfig = function (cb) {
    debug(self.name.blue, '(fb)->(config)');
    if (_.isUndefined(cb)) {
      cb = _.noop;
    }
    // to recieve the configuration from firebase first
    fb.app.getConfig(self.appId, function (err, resp) {
      debug('FB Config > '.green, resp);
      if (err) return cb(err);
      // set default meta information
      if (_.isNull(resp) || resp === false) {
        debug('Fallback to file. No Policy / ID Available.');
        // no record in FB. read local?
        self.config = self.getConfigFromFile();
      } else {
        debug('Using FB Config');

        // validated is a field added by app-config-helper after populating and validating the config 
        if (resp.validated) {
          debug('FB Configuration Validated');

          // check again for validity on app start
          var valid = configHelper.validate(resp);

          if (!valid) {
            self.stop();
            return cb('Application has valid flag, but is invalid');
          }

          self.config = resp;
          cb(err, self.config);
        } else {

          // need to put meta back into config to validate
          // stripped out and put on another node in fb
          fb.app.getMeta(self.appId, function (err, meta) {
            _.merge(meta, resp);

            // validate
            self.config = configHelper.validate(resp);

            if (self.config === false) {
              console.warn('Invalid Configuration from Firebase. File Fallback.', resp);

              // if bad config in firebase, refresh from file and try again
              var fileConfig = self.getConfigFromFile();
              self.config = configHelper.validate(fileConfig);

              if (self.config === false) {
                self.stop();
                return cb(new Error('Invalid File Configuration ' + resp));
              }
              // save to firebase
              debug('valid file config');
              self.syncConfig(self.config, function (err) {
                if (err) console.error(err);
                cb(err, self.config);
              });
            } else {
              console.warn('firebase config valid, but not validated, check flow');
              cb(null, self.config);
            }
          });
        }
      }



    });
  };

  self.changeSetting = function (config) {
    fb.app.changeSettings(self.appId, config);
  };

  self.initCV = function () {
    Matrix.service.ves.spawn();
  };

  // used?
  self.validateConfig = function (config) {
    if (config.name !== self.name) {
      return new Error('Configuration name needs to match application name.');
    }
  };

  self.writeConfigFile = function () {
    writeAppConfigFile(self.name, self.config);
  };

  self.getConfigFromFile = function () {
    var configFile = Matrix.config.path.apps + '/' + self.name + '.matrix/config.yaml';
    var config = configHelper.read(configFile);
    debug('(file)->(config)', self.name, config);


    config = configHelper.validate(config);

    // save molested version to FB
    saveAppConfig(self.appId, config);

    return config;
  };

  self.clearConfig = function () {

    fb.app.set(self.appId, {});
  };

  self.watchForUpdates = function () {
    console.warn('apps do not watch for config updates yet');
    // fb.app.onChange(self.appId, function(){
    // })
  };

  // this is called after all methods are defined. unlike other init methods, this is not called on boot
  function init(cb) {

    debug('init:', self.name);

    // need id to reference future FB commands
    fb.app.getIDForName(self.name, function (err, appId) {
      if (err) return console.error(err);

      debug('id=>', appId);
      // firebase requires appId for each call, don't pass to private methods
      self.appId = appId;

      async.parallel([
        function config(cba) {
          self.getConfig(function (err, config) {
            if (err) return cba(err);

            debug('config=>', config);
            self.config = config;

            self.sensors = (config.hasOwnProperty('sensors')) ? config.sensors : [];
            // these are used to map messages back to apps
            self.services = (config.hasOwnProperty('services')) ? config.services : [];
            self.integrations = (config.hasOwnProperty('integrations')) ? config.integrations : [];

            // parse config.services to find valid terms for `matrix.service(term)`
            self.validInitServiceCmds = _.reduce(config.services, (names, params) => {
              // params = engine: detection, type: face
              var add = names;
              for (var k in params) {
                if (params.hasOwnProperty(k)) {
                  // property k
                  add.push(k);
                  // value from param k
                  add.push(params[k]);
                }
              }
              if (_.compact(add).length !== add.length) {
                console.warn('undefined service name initialized', add);
              }

              return add;
            }, []);

            // ignore policy on dev
            if (process.env.NODE_ENV === 'dev') {
              activateIntegrations(self.integrations);
            }

            cba();
          });
        },

        // Policy determines which device services and sensors are made explicitly available for users.
        function policy(cba) {
          fb.app.getPolicy(self.appId, function (err, policy) {
            if (err) return cba(err);

            if (_.isEmpty(policy)) {
              self.policy = {};
              // for whatever reason, there is no policy written to firebase
            }

            self.policy = policy;
            debug('==== policy ===== vvvv');
            // if no fb record, default to file
            self.sensorList = _.keys(_.pickBy(self.policy.sensors, function (v) { return v; }));
            self.integrationList = _.keys(_.pickBy(self.policy.integrations, function (v) { return v; }));
            self.serviceList = _.keys(_.pickBy(self.policy.services, function (v) { return v; }));
            self.eventList = _.keys(_.pickBy(self.policy.crosstalk, function (v) { return v; }));

            debug('sensors', self.sensorList);
            debug('integrations', self.integrationList);
            debug('services', self.serviceList);
            debug('crosstalk', self.crosstalkList);
            cba();
          });
        }
      ], function (err) {
        if (err) console.error(err);
        if (_.isFunction(cb)) { cb(err); }
      });
    });

  }

  // interface for stopping apps
  self.stop = function () {
    Matrix.service.manager.stop(name);
  };

  // fire it off when ready
  init(cb);

  // return this object to manager.js for use in Matrix.activeApplications
  return self;
}

/**
 * Write application configuration object to fb
 * @param {string} appId - application ID in firebase. 
 * @param {} config - configuration object to write
 * @param {WriteCallback} cb
 * @callback WriteCallback - from firebase
 * @param {Error} err
 * @param {FirebaseObject} - descriptor for use with firebase, don't use, abstracted via matrix-firebase
 */

function saveAppConfig(appId, config, cb) {
  debug('(config)->[FB]', appId.blue);
  var fb = Matrix.service.firebase;

  fb.app.setConfig(appId, config, cb);
}

/** 
 * write config object to application config.yaml
 * @param {String} name 
 * @param {Configuration} config 
 * @param {WriteAppCallback} cb 
 * @callback WriteAppCallback
 * @param {Error} err Error
 * @param {fs} - file descriptor
 */

function writeAppConfigFile(name, config, cb) {
  var configFile = Matrix.config.path.apps + '/' + name + '.matrix/config.yaml';
  config = yaml.safeDump(config);
  fs.writeFile(configFile, config, cb);
}

function updateConfigKey(options, cb) {
  var configFile = Matrix.config.path.apps + '/' + options.name + '.matrix/config.yaml';
  var config = yaml.loadSafe(fs.readFileSync(configFile));
  if (config.hasOwnProperty('configuration')) {
    //FIXME: Depreciate this path
    console.warn('`configuration` in app config', options);
    config.configuration[options.key] = options.value;
  } else {
    // this is the newness
    config.settings[options.key] = options.value;
  }
  var configJs = yaml.safeDump(config);
  fs.writeFile(configFile, configJs, cb);
}

// Go through list of integrations and activate
// TODO: Expand this list as able. zwave, etc
function activateIntegrations(integrations) {
  debug('activating integrations', integrations);
  if (!_.isUndefined(integrations) && integrations.indexOf('zigbee') !== 1) {
    Matrix.device.drivers.zigbee.activate();
  }
}

module.exports = {
  Application: Application,
  updateConfigKey: updateConfigKey,
  writeAppConfigFile: writeAppConfigFile,
  saveAppConfig: saveAppConfig
};
