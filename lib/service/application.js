
  var yaml = require('js-yaml')
  var fs = require('fs')
  var debug = debugLog('Application')
  var configHelper = require('matrix-app-config-helper')


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
   * @method clearConfig - remove firebase configuration
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


function Application(name, cb){
    debug(name.blue, 'new Instance')
    var self = this;
    var fb = Matrix.service.firebase;

  self.name = name;
  self.config = {};
  self.policy = {};

  self.setRuntimeStatus = function ( status ) {
    if ( self.hasOwnProperty( 'appId' ) && !_.isUndefined( self.appId ) && !_.isUndefined( status ) ) {
      fb.app.setStatus(self.appId, status);
      if ( status === 'active' ) {
        fb.app.setOnline( self.appId, true );
      } else {
        fb.app.setOnline( self.appId, false );
      }
    } else {
      console.log( 'Runtime status update error' );
    }
  };


  // upload a configuration, or use the local one
  self.syncConfig = function ( config, cb ) {
    debug( self.name.blue, '[' + self.appId.grey + ']', 'Sync Config' )
    if ( _.isUndefined( self.appId ) ) {
      return console.error( 'No appId defined for syncConfig' );
    }

    // todo: check for validation
    if ( config.validated === true && self.name === config.name ) {
      if ( _.isObject( config ) || !_.isFunction( config ) ) {

        // if config sent, update fb, event will populate file change
        saveAppConfig( self.appId, config, cb );
        self.config = config;
      } else {
        cb = config;
        // no obj sent - send local
        saveAppConfig( self.appId, self.config, cb );
      }
    } else {
      // errors and revalidate
      if ( self.name !== config.name ) {
        console.error( self.name, ' does not match file config name '.red, config.name )
      } else {
        debug( 'Validating configuration in syncConfig' );
        var theConfig = configHelper.validate( config );
        if ( theConfig === false ) {
          console.error( 'Config is not valid for sync', config )
        } else {
          debug( 'Resyncing Configuration...', self.name, config )
          self.syncConfig( theConfig, cb );
        }
      }
    }
  };

  // check firebase, or use local file
  self.getConfig = function ( cb ) {
    debug( self.name.blue, '(fb)->(config)' )
    if ( _.isUndefined( cb ) ) {
      cb = _.noop;
    }
    // to recieve the configuration
    fb.app.getConfig( self.appId, function ( err, resp ) {
      debug( 'FB Config >>>> '.green, resp );
      if ( err ) return cb( err );
      // set default meta information
      if ( _.isNull( resp ) || resp === false ) {
        debug( 'Fallback to file. No Policy / ID Available.' )
        // no record in FB. read local?
        self.config = self.getConfigFromFile();


      } else {
        debug( 'Using FB Config' )
        if ( resp.validated ) {
          debug( 'FB Configuration Validated' )
          self.config = resp;
          cb( err, self.config );
        } else {
          // need to put meta back into config to validate
          fb.app.getMeta( self.appId, function ( err, meta ) {
            _.merge( meta, resp );

            //   populate config
            self.config = configHelper.validate( resp );

            if ( self.config === false ) {
              console.warn( 'Invalid Configuration from Firebase. File Fallback.', resp );
              // if bad config in firebase, refresh from file and validate
              var fileConfig = self.getConfigFromFile();
              self.config = configHelper.validate( fileConfig );

              if ( self.config === false ) {
                return cb( new Error( 'Invalid File Configuration ' + resp ) );
              }
              // save to firebase
              debug( 'valid file config' )
              self.syncConfig( self.config, function ( err ) {
                if ( err ) console.error( err );
                cb( err, self.config )
              })
            } else {
              console.warn( 'firebase config valid, but not validated, check flow' )
              cb( null, self.config );
            }
          })
        }
      }



    })
  }


  self.initCV = function () {
    Matrix.service.ves.spawn()
  }

  self.validateConfig = function ( config ) {
    if ( config.name !== self.name ) {
      return new Error( 'Configuration name needs to match application name.' )
    }
  }

  self.writeConfigFile = function () {
    writeAppConfigFile( self.name, self.config );
  }

  self.getConfigFromFile = function () {
    var configFile = './apps/' + self.name + '.matrix/config.yaml';
    var config = configHelper.read( configFile );
    debug( '(file)->(config)', self.name, config )


    config = configHelper.validate( config );

    // save molested version to FB
    saveAppConfig( self.appId, config );

    return config;
  }

  self.clearConfig = function () {

    fb.app.set( self.appId, {});
  }

  self.watchForUpdates = function () {
    console.warn( 'apps do not watch for config updates yet' )
    // fb.app.onChange(self.appId, function(){
    // })
  }

  function init( cb ) {

    debug( 'init:', self.name )

    fb.app.getIDForName( self.name, function ( err, appId ) {
      if ( err ) return console.error( err );

      debug( 'id=>', appId );
      // firebase requires appId for each call, don't pass to private methods
      self.appId = appId;

      async.parallel([
        function config( cba ) {
          self.getConfig( function ( err, config ) {
            if ( err ) return cba( err );

            debug( 'config=>', config )
            self.config = config;

            self.sensors = config.sensors;
            // these are used to map messages back to apps
            self.services = config.services;
            self.integrations = config.integrations;

            self.validInitServiceCmds = _.reduce( config.services, ( names, params ) => {
              // params = engine: detection, type: face
              var add = names;
              for (var k in params) {
                if (params.hasOwnProperty(k)) {
                  // serviceName
                  add.push(k);
                  // service type
                  add.push(params[k].type);
                  // service engine
                  add.push(params[k].engine);
                }
              }
              if ( _.compact(add).length !== add.length ){
                console.warn('undefined service name init', add);
              }


              return add;
            }, []);

            // ignore policy on dev
            if ( process.env.NODE_ENV === 'dev'){
              activateIntegrations( self.integrations )
            }

            cba();
          });
        },

        function policy( cba ) {
          fb.app.getPolicy( self.appId, function ( err, policy ) {
            if ( err ) return cba( err );

            if ( _.isEmpty(policy)){
              self.policy = {};
              // for whatever reason, there is no policy written to firebase
            }

            self.policy = policy;
            // if no fb record, default to file
            self.sensors =  _.keys( _.pick( self.policy.sensors, function(v){ return v }));
            self.integrations =  _.keys( _.pick( self.policy.integrations, function(v){ return v }));
            self.services =  _.keys( _.pick( self.policy.services, function(v){ return v }));
            self.crosstalk =  _.keys( _.pick( self.policy.crosstalk, function(v){ return v }));

            debug('sensors', self.sensors)
            debug('integrations', self.integrations)
            debug('services', self.services)
            debug('crosstalk', self.crosstalk)
            cba();
          });
        }
    ], function(err){
        if(err) console.error(err);
        if (_.isFunction(cb)) { cb(err); }
      });
    })

  }

  init(cb);

  return self;
}

function saveAppConfig( appId, config, cb ) {
  debug( '(config)->[FB]', appId.blue )
  var fb = Matrix.service.firebase;

  fb.app.setConfig( appId, config, cb );
}

function writeAppConfigFile( name, config ) {

  var configFile = './apps/' + options.name + '.matrix/config.yaml';
  config = yaml.safeDump( config );
  fs.writeFile( configFile, cb );
}

function updateConfigKey( options, cb ) {
  var configFile = './apps/' + options.name + '.matrix/config.yaml';
  var config = yaml.loadSafe( fs.readFileSync( configFile ) );
  if ( config.hasOwnProperty( 'configuration' ) ) {
    //FIXME: Depreciate this path
    console.warn( '`configuration` in app config', options )
    config.configuration[ options.key ] = options.value;
  } else {
    // this is the newness
    config.settings[ options.key ] = options.value;
  }
  var configJs = yaml.safeDump( config );
  fs.writeFile( configFile, configJs, cb );
}

// Go through list of integrations and activate
function activateIntegrations( integrations ){
  if ( integrations.indexOf('zigbee') !== 1){
    Matrix.device.drivers.zigbee.activate();
  }

}

module.exports = {
  Application: Application,
  updateConfigKey: updateConfigKey,
  writeAppConfigFile: writeAppConfigFile,
  saveAppConfig: saveAppConfig
}
