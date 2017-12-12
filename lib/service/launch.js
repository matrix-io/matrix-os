/**
 * Launch handles all the pre-ASCII logic. Determines whether to pull creds from env vars, service or prompt user for BT.
 * @exports {Boolean} check.online - is this device online capable? do we need to setup wifi?
 * @exports {Boolean} check.offline - do we need to do an offline setup?
 */


let debug = debugLog('launch');
let optional = require('optional');

let bleno = optional('bleno');

let checks = {
  offline: false,
  online: false
}


let malosInfoOut = '';

// STEP 1
function offlineSetup(callback) {
  async.series([ //Device offline setup
    // Reads the local device DB to grab device id and secret

    function areWeConductingASiegeTest(cb) {

      //If device data isn't present    
      if (!Matrix.service.auth.isSet() || process.env.hasOwnProperty('MATRIX_SIEGE_TEST')) {

        Matrix.SIEGE = true;

        // for siege testing, pull from local service
        debug('siege test')
        const r = require('request');
        r.get('http://siege-cred-service:8000/next', (err, resp, data) => {
          if (err) return console.error(err);
          var creds = data.toString().split(' ');
          Matrix.deviceId = creds[0];
          Matrix.deviceSecret = creds[1];
          log(creds);
          cb();
        })

      } else {
        cb();
      }
    },


    function offlineDeviceRegistration(cb) {

      //If device data isn't present    
      if (!Matrix.service.auth.isSet()) {

        if (!process.env.hasOwnProperty('MATRIX_BLUETOOTH') || process.env.MATRIX_BLUETOOTH !== 'true') { //If no Bluetooth, alert and stop
          console.warn('Missing registration information! This device is not correctly configured.'.yellow);
          console.warn('You can use '.yellow + 'MATRIX CLI'.green + ' to create a device in the platform and then add the '.yellow + 'MATRIX_DEVICE_ID'.gray + ' and '.yellow + 'MATRIX_DEVICE_SECRET'.gray + ' variables. \n\nIf you continue to have problems, please reach out to our support forums at'.yellow + ' http://community.matrix.one'.green);
          process.exit(1);
        } else if (!bleno) { //If using Bluetooth but missing bleno, alert and stop
          console.log('Missing bleno library, please install it and try again');
          console.log('You can install by going to the project folder and then running:');
          console.log('  > npm install bleno');
          process.exit(1);
        }

        //Using Bluetooth correctly
        console.warn('Missing registration information! This device is not correctly configured. \nYou can register and pair via Bluetooth to your device using the '.yellow + 'MATRIX'.green + ' mobile apps.'.yellow);
        console.warn('Alternatively, you can use '.yellow + 'MATRIX CLI'.green + ' to register the device manually to then add the '.yellow + 'MATRIX_DEVICE_ID'.gray + ' and '.yellow + 'MATRIX_DEVICE_SECRET'.gray + ' variables. \n\nIf you continue to have problems, please reach out to our support forums at'.yellow + ' http://community.matrix.one'.green);

        //Starts BLE registration advertising (Live device registration)
        Matrix.device.bluetooth.start(function () {
          console.log('Waiting for BLE pairing'.yellow);

          function onAuth(err, uuid, options) {
            if (!err) {
              console.log('Received BLE device info:', options);
              Matrix.service.auth.set(options.id, options.secret, function (err) {
                if (!err) {
                  console.log('Device configured as:'.yellow, Matrix.deviceId.green);
                  //Removes the listener on successful auth, although it might not really be a big deal 
                  //Matrix.device.bluetooth.emitter.removeListener('deviceAuth', onAuth);
                  setTimeout(function () {
                    //Give it some time to close the connection
                    cb(); //Continue setup process
                  }, 1000);
                } else {
                  cb(new Error('Unable to store device info! (' + err.message + ')'));
                }
              }); //Update device id and device secret

            } else {
              Matrix.device.drivers.led.timedError(0.5, function () {
                Matrix.device.bluetooth.updateLed();
                //cb(err); //Don't return, just wait for a proper registration
              });
            }
          }
          Matrix.device.bluetooth.emitter.on('deviceAuth', onAuth);
        });

      } else {
        console.log('Starting as device:'.yellow, Matrix.deviceId.green);
        cb();
      }
    },
    function startConfigurationBLE(cb) {

      // env vars have creds, skip BT
      if (Matrix.preAuth === true) {
        return cb();
      }

      //If BLE isn't specified in an env var then skip it
      if (!process.env.hasOwnProperty('MATRIX_BLUETOOTH') || process.env.MATRIX_BLUETOOTH !== 'true') return cb();
      if (!bleno) {
        console.log('Missing bleno library, please install it and try again');
        console.log('You can install by going to the project folder and then running:');
        console.log('  > npm install bleno');
        process.exit(1);
      }


      //Starts BLE configuration
      Matrix.device.bluetooth.start(function () {
        Matrix.device.bluetooth.emitter.on('configurationAuth', function (err, uuid, auth) {
          if (err || !auth) {
            console.log('No BT auth provided', err);
          } else {
            Matrix.ok.bluetooth = true;
            console.log('BT Successfully authenticated!');
          }
        });
        cb(); //Continue device initialization
      });
    }
  ],
    function offlineSetupEnds(err) {
      if (err) console.error('Unable to setup offline MOS, something went wrong (' + err.message + ')');
      else debug('Offline setup successful');
      callback(err);
    }
  );
}


// STEP 2
function onlineSetup(callback) {
  async.series([ //Device online setup
    // Make sure we can see the API server for auth
    function checkApiServer(cb) {
      debug('Checking API server...'.green);
      require('https').get(Matrix.apiServer, function (res) {
        Matrix.ok.connected = true;
        cb();
      }).on('error', function () {
        error('No API Server Visible', Matrix.apiServer);
        Matrix.ok.connected = false;
        cb();
      });
    },


    // Authenticate using current device data
    function getToken(cb) {
      Matrix.service.token.populate(function (err) {
        if (err) {
          if (!_.isEmpty(err.status_code) && err.status_code === 400) { //Device not found
            //Possibly trigger a device configuration reset?,
            //Alternatively ignore deviceId and secret and go back to BLE device registration?
            console.warn('Please make sure your device is properly registered and you are using the proper environment.');
            return onDestroy();
          } else {
            cb(err);
          }
        } else {
          cb(err);
        }
      });
    },

    // Lets login to the streaming server
    function mxssInit(cb) {

      if (!process.env.hasOwnProperty('MATRIX_NOMXSS')) {
        Matrix.service.stream.initSocket(cb);
      } else {
        cb();
      }

    },

    // Initialize Firebase
    function firebaseInit(cb) {
      debug('Starting Firebase...'.green + ' U:', Matrix.userId, ', D: ', Matrix.deviceId, ', DT: ', Matrix.deviceToken);
      Matrix.service.firebase.init(Matrix.userId, Matrix.deviceId, Matrix.deviceToken, Matrix.env, function (err, deviceId) {
        if (err) {
          return cb(err);
        } else {
          Matrix.service.firebase.initialized = true;
        }
        if (deviceId !== Matrix.deviceId) {
          return cb('firebase / deviceid mismatch' + deviceId + ' != ' + Matrix.deviceId);
        }
        cb(err, deviceId);
      });
    },

    // Update local app folders according to device remote configuration
    function syncApps(cb) {
      // Gets all apps

      // this is populated from init>getallapps
      Matrix.localApps = Matrix.service.firebase.util.records.apps || Matrix.localApps;
      // debug('userApps->', Matrix.localApps);
      console.log('Installed Apps:'.green, _.map(Matrix.localApps, 'name').join(', ').grey);

      async.parallel({
        //Check what local apps are currently installed. Results returned: { AyudaF: '0.2.6' }
        local: function (next) {
          let yaml = require('js-yaml');
          fs.readdir(Matrix.config.path.apps, function (err, appsDir) {
            let appFolders = _.filter(appsDir, function (a) {
              return (a.indexOf('.matrix') > -1);
            });

            let localVersions = {};
            appFolders.forEach(function (appFolder) {
              let packageFile, config;
              try {
                packageFile = require(Matrix.config.path.apps + '/' + appFolder + '/package.json');
                config = yaml.safeLoad(fs.readFileSync(Matrix.config.path.apps + '/' + appFolder + '/config.yaml'));
              } catch (err) {
                console.log('Unable to process app in', appFolder.yellow, '.', err.message);
              }

              localVersions[config.name] = packageFile.version;

            });

            next(undefined, localVersions);
          });
        },

        /* 
        Check remote apps installed to device (firebase -> deviceapps). Results returned: 
        { 
          AyudaF:{
            createdAt: 1510852890194,
            description: 'Revolutionize the way you interact with signs',
            icon: '',
            name: 'AyudaF',
            updatedAt: 1510866488433,
            version: '0.2.6',
            id: 'a8c1270ed574'
          }
        }
        */
        remote: function (next) {

          //Add key (id) as a field
          var apps = Matrix.localApps;
          var remoteVersions = _.mapValues(apps, function (app, id) {
            app.id = id;
            return app;
          });

          //Change key to app name
          remoteVersions = _.mapKeys(remoteVersions, function (app) { return app.name; });

          next(undefined, remoteVersions);
        }
      }, function (err, results) {
        if (err || !results) {
          if (err) console.log('Unable to retrieve apps data', err.message);
        }

        var variance = [];

        //Is there a missing app or with a version mismatch?
        if (results && results.remote) {
          _.forIn(results.remote, function (remoteApp, name) {
            if ((!results.local || !results.local[name]) || results.local[name] !== remoteApp.version) {
              console.log('App mismatch found:', name ? name : '', '', results.local[name] ? results.local[name] : '', '!=', remoteApp.version);
              variance.push(remoteApp);
            }
          });
        }

        if (variance.length === 0) {
          debug('Invariance. Clean System. Matching Records');
          cb();
        } else {
          debug('Variance detected between registered applications and applications on device.');

          // find apps which aren't on the device yet
          async.each(variance, function (app, next) {

            Matrix.service.firebase.deviceapps.get(app.id, function (appRecord) {

              var url = appRecord && appRecord.meta && appRecord.meta.file ? appRecord.meta.file : undefined;

              if (url && url.indexOf('...') === -1) { // filter out test appstore records (we can probably remove the ... check now?)
                console.log('['.yellow, app.id, '] === Offline Installation === ['.yellow, app.name.toUpperCase(), app.version, ']'.yellow);

                Matrix.service.manager.install({
                  name: app.name,
                  version: app.version || '1.0.0',
                  url: url,
                  id: app.id
                }, function (err) {
                  if (err) console.log('Local app update failed ', err);
                  next(err);
                });

              } else {
                console.log('Skipping '.yellow + app.id + ' ['.yellow, app.name.toUpperCase(), app.version, ']'.yellow);
                next();
              }
            });
          }, cb);
        }
      });

    },

    // Reset apps status in Firebase to Inactive
    Matrix.service.manager.resetAppStatus,

    //Listens for apps deploy, install and removal
    function setupFirebaseListeners(cb) {
      debug('Setting up Firebase Listeners...'.green);

      //If we don't want the device to handle installs
      if (process.env.hasOwnProperty('NO_INSTALL')) {
        return cb();
      }

      //App uninstalls
      Matrix.service.firebase.app.watchUserAppsRemoval(function (app) {
        debug('Firebase->UserApps->(X)', app.id, ' (' + app.name + ')');
        // app to uninstall!
        // refresh app ids in case of recent install
        Matrix.service.manager.stop(app.name, function (err) {
          if (err) console.error('Unable to stop app');
          console.log('app stopped', app.name);
          Matrix.service.firebase.app.getUserAppIds(function (appIds) {
            if (_.keys(appIds).indexOf(app.id) === -1) {
              console.log('uninstalling ', app.name + '...');
              Matrix.service.manager.uninstall(app.name, function (err) {
                if (err) return error(err);
                console.log('Successfully uninstalled ' + app.name.green);
              });
            } else {
              console.log('The application ' + app.name + ' isn\'t currently installed on this device');
            }
          });
        });
      });

      //App install update
      Matrix.service.firebase.user.watchAppInstall(Matrix.deviceId, function (app, appId) {
        if (!_.isUndefined(app) && !_.isUndefined(appId)) {
          Matrix.localApps[appId] = app;

          console.log('installing', appId);
          Matrix.service.firebase.deviceapps.get(appId, function (app) {
            debug('App data: ', app);
            var appName = app.meta.shortName || app.meta.name;
            var installOptions = {
              url: app.meta.file || app.file, //TODO only use meta
              name: appName,
              version: app.meta.version || app.version, //TODO only use meta
              id: appId,
              running: Matrix.activeApplications.some((a) => {
                return (a.name === appName);
              })
            };

            debug('Trying to install: ' + appName.yellow);
            Matrix.service.manager.stop(appName, function (err, appStopped) {
              Matrix.service.manager.install(installOptions, function (err) {
                debug('Finished index install');
                console.log(appName, installOptions.version, 'installed from', installOptions.url);
                //TODO Start the app if it was running before deployment?
                //if (appStopped) Matrix.service.manager.start(appName);
              });
            });
          });
        } else {
          debug('Empty app install triggered');
        }
      });

      cb();
    },

    //Firebase records integrity check
    function checkFirebaseInfo(cb) {
      debug('Checking Firebase Info...'.green);
      Matrix.service.firebase.device.get(function (err, device) {
        if (err || _.isNull(device)) return cb('Bad Device Record');
        debug('[fb]devices/>'.blue, device);
        Matrix.service.firebase.user.checkDevice(Matrix.deviceId, function (err, device) {
          if (err || _.isNull(device)) return cb('Bad User Device Record');
          debug('[fb]user/devices/deviceId>'.blue);
          if (_.has(device, 'apps')) {
            _.forIn(device.apps, function (v, k) {
              debug(k + ' - ' + v.name);
            });
          } else {
            debug('No apps installed on this device', Matrix.deviceId);
          }
          cb();
        });
      });
    }
  ], function onlineSetupEnds(err) {
    if (err) {
      var errorCode = err.code ? err.code : err.status_code;
      console.error('Unable to setup online MOS, something went wrong (' + errorCode + ') (' + err.message + ')');
      callback(err);
    } else {

      Matrix.device.drivers.led.stopLoader();
      Matrix.device.drivers.led.clear();

      // MXSS
      if (Matrix.registerOK) log('MXSS Connected:'.green, Matrix.streamingServer.grey);
      else error('MXSS Unavailable'.red);

      // MALOS
      if (malosInfoOut.length > 0) log('MALOS COMPONENTS', malosInfoOut);
      else error('MALOS Unavailable'.red);

      // MOS
      log(Matrix.is.green.bold, '['.grey + Matrix.deviceId.grey + ']'.grey, 'ready'.yellow.bold);
      log('['.grey + Matrix.userId.grey + ']'.grey);
      Matrix.banner();

      //if START_APP is set
      if (Matrix.config.fakeApp) Matrix.service.manager.start(Matrix.config.fakeApp);

      // Siege check
      if (!_.isUndefined(Matrix.SIEGE) && Matrix.SIEGE === true) {
        async.series([
          function (cb) {
            if (Matrix.localApps.indexOf('Siege') < 0) {
              Matrix.service.install({
                name: 'Siege',
                url: 'https://storage.googleapis.com/dev-admobilize-matrix-apps/apps/siegeTest/0.0.1.zip',
                version: '0.0.1'
              }, cb)
            }
          },
          function (cb) {
            Matrix.service.manager.start('Siege', cb);
          }
        ])
      }

      //for tests
      Matrix.events.emit('matrix-ready');

      if (Matrix.hasOwnProperty('latestVersion') && Matrix.latestVersion !== Matrix.version) {
        console.log('MATRIX OS can be upgraded.'.yellow, Matrix.latestVersion, 'available!'.yellow, Matrix.version);
      }

      // CLI uses IPC for tests
      if (process.hasOwnProperty('send')) process.send({ 'matrix-ready': true });

      if (process.env.hasOwnProperty('REPL')) {
        const repl = require('repl');
        repl.start('> ').context.Matrix = Matrix;
      }

      Matrix.service.lifecycle.updateLastBootTime();
      debug('Online setup successful!');
      callback();
    }
  });
}


module.exports = {
  checks: checks,

  init: function readLocalDeviceInfo() {

    Matrix.device.malos.info(function (data) {
      _.each(data.info, function (i) {
        malosInfoOut += ' ⚙ '.yellow + i.driver_name.blue + ':' + i.base_port + ' | ' + i.notes_for_human.grey + '\n';
      });
    });

    // Checks Env Variables for ID/Secret
    if (!_.isUndefined(Matrix.deviceId) && !_.isUndefined(Matrix.deviceSecret)) {
      Matrix.preAuth = true;
      console.log('Not using device data from db, using '.yellow + 'MATRIX_DEVICE_ID'.gray + ' and '.yellow + 'MATRIX_DEVICE_SECRET'.gray + ' instead!'.yellow);
      return;
    } else {
      // Check db for ID/secret
      Matrix.db.device.findOne({
        id: { $exists: true },
        secret: { $exists: true },
        env: Matrix.env
      }, function (err, result) {
        if (err) console.log('Error reading local data!');
        if (!err) {
          if (_.isNull(result)) {
            debug('Sadly, we got no device records :(');
          } else {
            if (_.has(result, 'id') && _.has(result, 'secret')) {
              debug('Device data found: ', result);
              Matrix.deviceId = result.id;
              Matrix.deviceSecret = result.secret;
            } else {
              err = new Error('No id and secret found for this device');
            }
          }
        }
        return error(err);
      });
    }
  },
  offlineCheck:
    function (next) {
      if (!checks.offline)
        offlineSetup(function (err) {
          if (!err) checks.offline = true;
          next(err);
        });
      else next();
    },

  onlineCheck: function (next) {
    if (!checks.online)
      onlineSetup(function (err) {
        if (!err) checks.online = true;
        next(err);
      });
    else next();
  },

}



/** Not being used */
function upgradeDependencies(cb) {

  var updated = false;
  var helper = require('matrix-app-config-helper');
  var eventFilter = require('matrix-eventfilter');
  var piwifi = require('pi-wifi');

  //Get recent version
  async.parallel({
    helperVersion: function (cb) {
      if (_.has(helper, 'checkVersion')) helper.checkVersion(function (err, version) {
        console.log('DEP helper: ', err, version);
        cb(err, version.updated);
      });
      else cb(undefined, helper.current);
    },
    apiVersion: function (cb) {
      if (_.has(Matrix.api, 'checkVersion')) Matrix.api.checkVersion(function (err, version) {
        console.log('DEP api: ', err, version);
        cb(err, version.updated);
      });
      else cb(undefined, Matrix.api.current);
    },
    firebaseVersion: function (cb) {
      if (_.has(Matrix.service.firebase, 'checkVersion')) Matrix.service.firebase.checkVersion(function (err, version) {
        console.log('DEP firebase: ', err, version);
        cb(err, version.updated);
      });
      else cb(undefined, Matrix.service.firebase.current);
    },
    eventVersion: function (cb) {
      if (_.has(eventFilter, 'checkVersion')) eventFilter.checkVersion(function (err, version) {
        console.log('DEP event: ', err, version);
        cb(err, version.updated);
      });
      else cb(undefined, eventFilter.current);
    },
    piwifiVersion: function (cb) {
      if (_.has(piwifi, 'checkVersion')) piwifi.checkVersion(function (err, version) {
        console.log('DEP pi: ', err, version);
        cb(err, version.updated);
      });
      else cb(undefined, piwifi.current);
    }

  },
    function versionResults(err, results) {
      var olds = _.filter(results, function (o) { return o === false; });
      if (olds.length > 0) {
        console.log('Upgrading Dependencies....'.yellow);
        exec('npm upgrade matrix-node-sdk matrix-app-config-helper matrix-firebase matrix-eventfilter pi-wifi', function (error, stdout, stderr) {
          if (error) {
            console.error('Error upgrading dependencies: '.red + error);
            err = error;
          } else {
            checks.update = true;
            updated = true;
            console.log('Dependencies upgrade Done!'.green, 'MATRIX OS restart required.');
          }
          cb(err);
        });
      } else {
        console.log('Dependencies up to date.');
        cb(err, updated);
      }
    });

}


/** Not Being Used */
function upgradeMOS(cb) {
  fs.readFile(__dirname + '/package.json', function (err, info) {
    if (err) {
      console.error('Unable to read package.json file'.red, err.message);
      return cb(err, false);
    }

    try {
      info = JSON.parse(info);
    } catch (error) {
      err = error;
    }
    if (err) {
      console.error('Unable to parse package.json file'.red, err.message);
      return cb(err, false);
    }
    var currentVersion = info.version;

    //Check the MOS 
    function processMOSVersion(remoteVersion, cb) {
      var err;
      var updated = false;
      if (currentVersion === remoteVersion) {
        debug('Latest Version Installed. ' + currentVersion.grey);
        checks.update = true;
        cb(err, updated);
      } else {
        //TODO Start Update LED motion
        updated = true;
        checks.update = true;
        console.log('MATRIX OS Upgrade Ready. ' + remoteVersion + ' now available.\n', 'Upgrading MATRIX OS....'.yellow);
        exec('git submodule update --init', function (error, stdout, stderr) {
          err = error;
          if (!err) {
            console.log('Modules updated... '.green);
            exec('git fetch && git pull', function (error, stdout, stderr) {
              err = error;
              if (!err) {
                console.log('Main code updated... '.green);
                console.log('Upgrade Complete: MATRIX OS restart required'.green);
              } else { //Code update failed
                debug('Error updating main code:\n', err.message);
                console.error('Unable to update MATRIX OS main code'.yellow);
                console.error('Please make sure you haven\'t modified any files ('.yellow + 'git status'.gray + '), check your connection and try again'.yellow);
                console.error('Alternatively, you can run MATRIX OS without the upgrade check in the meantime \''.yellow + 'NO_UPGRADE=true node index.js'.gray + '\''.yellow);
              }
              cb(err, updated);
            });
          } else { //Git submodules update failed
            debug('Error updating modules:\n', err.message);
            console.error('Unable to update MATRIX OS submodules'.yellow);
            console.error('Try \''.yellow + 'git submodule deinit -f ; git submodule update --init'.gray + '\' to fix your modules'.yellow);
            console.error('Alternatively, you can run MATRIX OS without the upgrade check in the meantime \''.yellow + 'NO_UPGRADE=true node index.js'.gray + '\''.yellow);
            cb(err, updated);
          }

        });
      }
    }

    //Send the actual request
    require('request').get(mosRepoURL, function (err, resp, body) {
      if (err) return console.error(err);

      try {
        Matrix.latestVersion = JSON.parse(body).version;
      } catch (error) {
        console.error('Unable to parse MATRIX OS version info:', error.message);
      }

    });

  });
}