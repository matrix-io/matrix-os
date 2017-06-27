// TODO: manager.js is a terrible name, needs fixing and refactoring
/**
 * Manager handles all app related needs, start, stop.
 * Firebase should be regarded as the master controller for application state
 * as clients change firebase, and MOS responds accordingly.
 * The only exception to this should be when using `START_APP`.
 * 
 * @exports start starts an app
 * @exports stop stops an app
 * @exports restart restarts an app
 * @exports install application install
 * @exports update update an install
 * @exports uninstall remove an application
 * @exports clearList remove applications from stored applications 
 * @exports killAllApps stop all applications
 * @exports getLogs return all application logs
 * @exports cleanLogs remove all application logs
 * @exports getAppRecordForPid lookup an application record from it's pid
 * @exports getAppActivity return application on/off according to firebase
 * @exports syncAppActivity open / close applications, defer to firebase status
 * @exports requestConfigs ask all applications to send configurations
 * @exports resetAppStatus stop all applications on firebase
 * 
 * @todo 
 */

/* App Management */

var r = require('request');
var fs = require('fs');
var debug = debugLog('app');
var treeKill = require('tree-kill');

function getAppRecordForPid(pid) {
  return _.find(Matrix.activeApplications, { pid: pid });
}

function getLogs() {
  try {
    fs.accessSync(Matrix.config.path.appLog + new Date().getDay());
    return fs.readFileSync(Matrix.config.path.appLog + new Date().getDay(), 'utf8');
  } catch (e) {
    error('App Log Error:', e);
  }
}

function cleanLogs(cb) {
  fs.readdirSync(Matrix.config.path.apps).filter(function(f) {
    // return logs, not todays log
    return ((f.indexOf('app.log') > -1) && (f.indexOf(new Date().getDay()) === -1));
  }).forEach(function(f) {
    fs.unlinkSync(Matrix.config.path.apps + '/' + f);
  });
  if (_.isFunction(cb)) {
    cb(null);
  }
}

function clearAppList(cb) {
  Matrix.db.service.remove({
    activeApplication: {
      $exists: true
    }
  }, {
    multi: true
  }, cb);
}


/*                                               88  88  
""                            ,d                 88  88  
                              88                 88  88  
88  8b,dPPYba,   ,adPPYba,  MM88MMM  ,adPPYYba,  88  88  
88  88P'   `"8a  I8[    ""    88     ""     `Y8  88  88  
88  88       88   `"Y8ba,     88     ,adPPPPP88  88  88  
88  88       88  aa    ]8I    88,    88,    ,88  88  88  
88  88       88  `"YbbdP"'    "Y888  `"8bbdP"Y8  88  */



/**
 * install an application. fired from firebase change right now.
 *
 * @param  {}   options          Install options
 * @param  ''   options.name     Application name
 * @param  ''   options.url      Application URL to download
 * @param  ''   options.version  SEMVER. Multiple versions are not supported.
 * @param  ''   options.running  Start this application after installing
 * @param  {Function} cb      [description]
 * @return {[type]}           [description]
 */
function installApp(options, cb) {
  debug('Install>', options);
  if (!_.has(options, 'version') || _.isUndefined(options.version)) {
    console.warn('No version provided for application install.');
    options.version = '';
  }

  if (!_.has(options, 'url') || _.isUndefined(options.url)) {
    return cb('No url provided for application install.' + options.url);
  }

  log('Install App: %s', options.name, options.version);
  debug(options.url.yellow);

  var name = options.name;
  var version = options.version;
  var url = options.url;
  var id = options.id;
  Matrix.service.firebase.app.setStatus(id, 'pending');

  if (_.isUndefined(url)) {
    cb('Application record not found');
    return;
  }
  var updateFile = '/tmp/matrix_app/' + name + '-' + version + Math.round(Math.random() * 100000) + '.zip';
  var targetDir = Matrix.config.path.apps + '/' + name + '.matrix/';

  if (!fs.existsSync('/tmp/matrix_app/')) {
    fs.mkdirSync('/tmp/matrix_app/');
  }

  r(url).pipe(fs.createWriteStream(updateFile))
    .on('error', function(err) {
      cb('Error Retrieving URL:' + url + err.message);
    })
    .on('close', function() {

      debug('zip download complete', url, '=>', updateFile);

      // make app directory if not made
      try {
        fs.accessSync(targetDir);
      } catch (e) {
        debug('Creating:'.green, targetDir);
        fs.mkdirSync(targetDir);
      }

      var extract = require('unzip2').Extract({
        path: targetDir
      });

      extract.on('error', function(e) {
        if (e.message.indexOf('invalid signature') > -1) {
          console.error('Bad Zip File');
        }
        console.error('app install error', e);
        Matrix.service.firebase.app.setStatus(id, 'error');
      });

      extract.on('close', function() {
        debug('zip finished extracting');

        // install options will determine if this app was running before install or not
        if (options.running) {
          Matrix.service.firebase.app.setStatus(id, 'active');
        } else {
          Matrix.service.firebase.app.setStatus(id, 'inactive');
        }

        // don't npm install on test app installations, breaks things
        if (process.env.hasOwnProperty('TEST_MODE')) {
          return cb();
        }

        // check for package.json
        try {
          fs.accessSync(Matrix.config.path.apps + '/' + name + '.matrix/package.json');
        } catch (e) {
          if (_.isFunction(cb)) {
            cb(name + ' does not have a ' + 'package.json'.blue + ' file');
          }
          return null;
        }


        debug('npm install:', name);
        require('child_process').execSync('npm install', {
          cwd: Matrix.config.path.apps + '/' + name + '.matrix/'
        });

        debug('App:', name, 'installed!');

        // this will restart the app if installation / deploy was done to a running app
        syncAppActivity(cb);
      });

      // extract zip to /apps, these are handled above
      debug('extracting =  =  =]', updateFile, '->', targetDir);
      fs.createReadStream(updateFile).pipe(extract);

    });
}

function killAllApps(cb) {
  _.each(Matrix.activeApplications, function(p) {
    stopApp(p.name);
  });

  if (_.isFunction(cb)) {
    cb(null);
  }
}


/*                                                
                                                     
             ,d                               ,d     
             88                               88     
,adPPYba,  MM88MMM  ,adPPYYba,  8b,dPPYba,  MM88MMM  
I8[    ""    88     ""     `Y8  88P'   "Y8    88     
 `"Y8ba,     88     ,adPPPPP88  88            88     
aa    ]8I    88,    88,    ,88  88            88,    
`"YbbdP"'    "Y888  `"8bbdP"Y8  88            "Y888  
*/


function startApp(name, cb) {
  // actually start app here
  if (_.isUndefined(name)) {
    return cb(new Error('Need to declare name'));
  }
  Matrix.events.emit('app-log', 'Launching: ' + name);

  // don't launch dupes - damn callback
  if (_.find(Matrix.activeApplications, {
    name: name
  })) {
    return error('Cannot start another instance of :', name);
  }


  // FIXME: this is a hack to launch all applications
  if (name === 'all-applications') {
    var names = fs.readdirSync(Matrix.config.path.apps);
    names = _.filter(names, function(n) {
      return (n.indexOf('.matrix') > -1);
    });
    log(names);
    _.each(names, function(n) {
      startApp(n.slice(0, -7), cb);
    });
    return;
  }

  var app;
  var pathToApp = Matrix.config.path.apps + '/' + name + '.matrix';

  var pwd = process.cwd();

  async.series([
    function makeAppInstance(cb) {
      debug('creating instance:'.blue, name);
      app = new Matrix.service.application.Application(name, cb);
    },
    function startAppProcess(cb) {
      // keep track of applications, route reply messages
      Matrix.activeApplications.push(app);
      debug('=== %s config === vvvv'.blue, name, app.id);
      debug(app.config);
      debug('=== %s policy === vvvv'.blue, name, app.id);
      debug(app.policy);


      _.remove(process.execArgv, function(v) {
        return (v.indexOf('--debug') > -1 || v.indexOf('-debug-brk') > -1);
      });


      //Check for app folder existance, expect the unexpected (╯°□°）╯︵ ┻━┻
      fs.access(pathToApp, function(err) {
        if (!err) {

          fs.writeFileSync(pathToApp + '/config.json', JSON.stringify(app.config));
          // TODO: Finish Docker switcheroo - Maybe only use for certian apps
          // Need to test performance
          var proc = require('child_process');


          // start apps in docker environment
          if (process.env.hasOwnProperty('DOCKER_APPS')) {

            try {
              var dockerImages = proc.execSync('docker images | cut -d" " -f1');
              // check for image 'matrix-apphost' in docker images
              if (dockerImages.indexOf('matrix-apphost') === -1) {
                // builds docker image for app hosting, see package.json
                // swaps out based on arch, arm and x64 supported
                proc.execSync('docker build -t matrix-apphost -f Dockerfile-apphost-' + process.arch);
              }

              // fire up docker image
              app.process = proc.spawn('docker', [
                'run', '-v', pwd + '/apps:/apps',
                // remove the container when exit
                '--rm',
                // reference by app name
                '--name', name,

                '-a', 'stdin', '-a', 'stdout', '-a', 'stderr',
                // '-t',
                '-i',
                'matrix-apphost',
                'node', 'apps/' + name + '.matrix/index.js'
              ], {
                stdio: ['pipe', 'pipe', 'pipe']
              });



              // app.process = proc.spawn('docker', ['run', '-v', pwd+'/apps:/apps', '--name', name, 'matrix-apphost', 'node','apps/'+name+'.matrix/index.js']);
              app.pid = app.process.pid;
              // because we're not forking, we have to stub out send
              app.process.send = function(msg) {
                app.process.stdin.write(JSON.stringify(msg) + '\n');
              };

              // app.process.stdin.write(JSON.stringify({foo: 'bar'})+ '\n');
              // app.process.on('error', console.error)
              // app.process.on('message', console.log)
              // app.process.on('close', console.log)

              app.process.docker = true;
              debug('Docker App Virtualization:'.yellow, name);
            } catch (e) {
              cb(new Error('Docker Error: ' + e));
            } finally {
              cb();
            }

          } else {

            // don't run debug on apps, conflicts with debugger
            if (process.execArgv.indexOf('--debug') > -1 || process.execArgv.indexOf('--debug-brk') > -1) {
              _.pull(process.execArgv, '--debug', '--debug-brk');
            }

            app.process = proc.fork(pathToApp + '/index.js', [], {
              // pipes logs to parent below
              silent: true,
              // make available to app environment
              env: app.config.settings
            });

            // keep track of event listeners
            app.process.handlers = {};
            app.pid = app.process.pid;
            app.appName = name;
            cb();
          }

        } else {
          console.log('App '.red + name.yellow + ' local folder wasn\'t found!'.red);
          Matrix.activeApplications = _.reject(Matrix.activeApplications, function(app) { //Remove from active applications
            return (app.name === name);
          });
          cb(new Error('The unexpected was expected, please avoid deleting app folders without letting MOS know'));
        }

      });

    },


    function setupInboundMessaging(cb) {
      debug('handle events:'.blue, name);

      // route interapp events to process
      var ct = Matrix.event.app.setupCrosstalk(name, function(m) {
        debug('[M]>(CT)>app(', name, m);

        if (_.has(m, 'type')) {
          m.type = 'app-message';
        }

        // send to application process, if available
        if (app.process.connected) {
          app.process.send(m);
        } else {
          console.error('Tried to send message to app without channel.', name, app.process);
        }

      });

      // handle CV routing back to apps
      var cv = Matrix.event.app.setupCVHandlers(name, function(err, m) {
        if (err) return console.error(err);
        debug('[CV]>', m);
        m.eventType = 'detection';
        app.process.send(m);
      });

      app.process.handlers = {
        cv: cv,
        crosstalk: ct
      };


      cb();

    },

    function setupLocalAppManagement(cb) {

      // when config changes, restart app
      // Matrix.service.firebase.app.watchConfig(app.appId, function() {
      //   console.log('App configuration changed');
      //   //restartApp( name ); //Removed this because it was causing 1-4 restarts on app deployment
      // });

      // for restarting active apps //TODO: Not complete
      // Matrix.db.service.insert({
      //   activeApplication: {
      //     name: name,
      //     pid: app.process.pid
      //   }
      // });
      //
      // app.process.send({
      //   'eventType':'container-ready',
      //   'app': name,
      //   'pid': app.process.pid
      // }, null);

      cb();
    },

    function fireOffConfigurationServices(cb) {
      debug('execute configuration:'.blue, name);


      //traverse configuration for VES

      // _.forIn(app.config.services, function(v, k) {
      //   var svcName = k;
      //   var ng = v.engine;
      //   var ngp = v.engineParams;

      //   //TODO:
      //   console.warn('TODO: Should start VES for ', v.engine);

      //   // start VES
      //   // Matrix.service.ves.spawn(Matrix.userId, Matrix.deviceRecordId, Matrix.deviceSecret, {
      //   //   engine: ng,
      //   //   options: ngp,
      //   //   type: svcName
      //   // });

      //   //TODO: add handler for ng return via mxss
      // });

      cb();
    },
    function handleAppOutbound(cb) {
      debug('set up messaging:'.blue, name);
      debug('==> %s pid %s '.blue, name, app.pid);

      // Relay App Logging into Sockets
      if (app.process.docker !== true) {
        app.process.stdout.on('data', function writeOutLog(data) {
          // write log event to file
          var day = new Date().getDay();
          var time = new Date().toISOString().slice(0, -5);
          var str = time + ' l o g [' + name + ']' + ' ' + data;
          fs.appendFile(Matrix.config.path.appLog + day, str);
          log('(' + name.yellow + ')', data.toString());

          //send out realtime update if not being watched
          if (!process.env.hasOwnProperty('DEBUG')) { Matrix.events.emit('app-log', str); }
        });

      } else {
        app.process.stdout.on('data', function writeOutDockerLog(data) {
          var msgs = [];
          try {
            data.toString().split('\n').map((m) => { if (!_.isEmpty(m)) msgs.push(JSON.parse(m + '\n')); });
          } catch (e) {
            console.error('Docker STDOUT Error:', e, data.toString(), '|||');
          } finally {
            msgs.forEach((m) => {
              app.process.emit('message', m);
            });
          }
        });
      }

      // Relay App Logging into Sockets
      app.process.stderr.on('data', function writeOutError(data) {
        var time = new Date().toISOString().slice(0, -5);
        var str = time + ' error [' + name + ']' + ' ' + data;
        // fs.appendFile(Matrix.config.path.appLog+day, str);

        app.setRuntimeStatus('error');

        error('(' + name + ')err'.red, data.toString());
        Matrix.events.emit('app-log', str);
        console.log('MATRIX OS quits applications when they write to `stderr`. This is commonly triggered by the debug node module (run DEBUG=false to get by in dev mode) or with console.error(). If you find this behavior unacceptable, contact us, this "feature" is open to discussion.');
        // stop the app on error
        stopApp(name);
      });

      //handle messages from apps
      app.process.on('message', Matrix.event.app.messageProcessHandler);
      app.process.on('close', Matrix.event.app.closeProcessHandler);
      app.process.on('exit', (code, number) => {
        Matrix.event.app.exitProcessHandler(code, number, app);
      });


      app.process.on('uncaughtException', (e) => {
        console.error('\n\n======== app %s crash\n', name, e);
      });

      app.process.on('beforeExit', () => {
        console.log('before exit', name);
      });
      app.process.on('SIGHUP', (d) => {
        console.log('APP SIGHUP', name, d);
      });
      app.process.on('SIGINT', (d) => {
        console.log('APP SIGINT', name, d);
      });
      app.process.on('SIGTERM', (d) => {
        console.log('APP SIGTERM', name, d);
      });

      app.process.on('disconnect', function() {
        //Remove from active applications
        Matrix.activeApplications = _.reject(Matrix.activeApplications, function(app) {
          return (app.name === name);
        });

        //Remove unused active services
        if (app.hasOwnProperty('services') && _.keys(app.services).length > 0) {

          Matrix.activeServices = _.reject(Matrix.activeServices, function(s) {
            // find app service names
            var t = _.find(app.services, (v) => {
              return (v.engine === s);
            });

            // cycle through active applications, see if other apps are using this service
            var otherAppsUsing = false;
            Matrix.activeApplications.forEach((a) => {
              var svc = a.services;
              _.each(svc, (v) => {
                if (v.engine === s) {
                  otherAppsUsing = true;
                }
              });
            });
            debug('>>>>> App disconnect service remove check', t);

            // other apps can't be using AND it's being used by this app
            return !otherAppsUsing && t;
          });

        }

        log('App IPC Disconnect', name);
      });

      app.process.on('error', function(err) {
        error('Error', err);
      });


      cb();

    },
  ], function(err) {
    if (err) {
      app.setRuntimeStatus('error');
      err.hasOwnProperty('message') ? console.log(err.message.red) : console.log(err);
      return console.log('Unable to start application, please make sure MOS and the Application are up to date.'.yellow);
    }

    console.log('==== Application %s started! ==== '.yellow, name);

    // Updates firebase deviceapps/ install record
    app.setRuntimeStatus('active');

    // update mxss with config
    Matrix.service.stream.send('app-config', app.config);

    // matrix process good to go
    app.process.send({
      'type': 'container-ready',
      'app': name,
      'pid': app.process.pid
    }, null);

    if (!_.isUndefined(cb)) {
      cb(null, app);
    }
  });

}



//              ,d                              
//              88                              
// ,adPPYba,  MM88MMM  ,adPPYba,   8b,dPPYba,   
// I8[    ""    88    a8"     "8a  88P'    "8a  
//  `"Y8ba,     88    8b       d8  88       d8  
// aa    ]8I    88,   "8a,   ,a8"  88b,   ,a8"  
// `"YbbdP"'    "Y888  `"YbbdP"'   88`YbbdP"'   
//                                 88           
//                                 88           
// id can be pid or appname
function stopApp(id, cb) {
  var error;
  var appStopped = false;
  log('Stopping'.red, id);

  if (id === 'all-applications') {
    killAllApps(cb);
  } else if (parseInt(id) === id) {
    debug('Killing process #' + id);
    cb(require('child_process').exec('kill ' + id));
  } else {
    debug('Killing process for app ' + id);
    // id == app name
    Matrix.events.removeAllListeners('app-' + id + '-message');
    // log('stop %s', id);
    // handle local variable

    var applicationInstance = _.find(Matrix.activeApplications, function(p) {
      return (p.name === id);
    });

    if (_.isUndefined(applicationInstance)) {
      debug('Application Stopped No Longer In activeApplications', id);
      if (_.isFunction(cb)) cb();
      return;
    }

    if (applicationInstance.hasOwnProperty('process') && applicationInstance.process.docker === true) {
      debug('stopping docker for ', id);
      require('child_process').execSync('docker stop ' + id);
    }

    //If the application was already started
    if (!_.isUndefined(applicationInstance)) {
      debug('Application ' + id + ' is running (' + applicationInstance.pid + ')');
      applicationInstance.setRuntimeStatus('inactive');

      // heads will roll o/ |o| \8/
      (function executioner() { treeKill(applicationInstance.pid); })();
      //remove app from process list
      Matrix.activeApplications = _.reject(Matrix.activeApplications, function(p) {
        return (p.name === id);
      });
      appStopped = true; //TODO Maybe actually make sure the process is killed?

    } else {
      debug('Application ' + id + ' isn\'t running');
      console.warn('Application instance not available', id);
      error = new Error('Application ' + id + ' wasn\'t started');
    }

    //remove app from process list
    Matrix.activeApplications = _.reject(Matrix.activeApplications, function(p) {
      return (p.name === id);
    });

    if (_.isFunction(cb)) cb(error, appStopped);
  }
}

function restartApp(name, cb) {
  log('restart', name);
  stopApp(name, function(err) {
    startApp(name, cb);
  });
}

function updateApp() {
  // installApp( url, name, version, cb )
}

function uninstallApp(name, cb) {
  var rmrf = require('rimraf');
  rmrf('apps/' + name + '.matrix', function(err) {
    if (err) error(err);
    log('Uninstalled', name);
    if (_.isFunction(cb)) cb();
  });
}

function resetAppStatus(cb) {
  debug('Stop all apps...'.green);
  //Retrieve status for each app
  async.each(Object.keys(Matrix.localApps), function(appId, done) {
    Matrix.service.firebase.app.getStatus(appId, function(status) {
      //Set default status to inactive
      if (_.isUndefined(status)) status = 'inactive';
      //If the status is active set online false and status inactive on the app
      if (status === 'active') {
        Matrix.service.firebase.app.setOnline(appId, false);
        Matrix.service.firebase.app.setStatus(appId, 'inactive');
      }
      done();
    });
  }, function(err) {
    if (err) console.error(err);
    if (_.isFunction(cb)) cb();
  });
}

/**
 * Ask firebase which applications are set on or off
 * @return [{}] appsOn { appName: true/false } 
 */

function getAppActivityStatus(cb) {
  debug('Refreshing app status from Firebase...'.green);
  var appsOn = {};
  if (!Matrix.hasOwnProperty('localApps')) {
    cb(new Error('App Activity requested before init is complete'))
  }
  async.each(Object.keys(Matrix.localApps), function(appId, done) {
    Matrix.service.firebase.app.getStatus(appId, function(status) {
      let name = Matrix.localApps[appId].name;
      if (_.isNull(status) || _.isUndefined(name)) {
        cb('No Status for Application', name, appId);
      }
      appsOn[name] = (status === 'active') ? true : false;
      done();
    });
  }, (err) => {
    if (err) return cb(err);
    debug(appsOn);
    cb(null, appsOn);
  });
}

/**
 * make MOS active application state match firebase status
 */

function syncAppActivity(cb) {
  getAppActivityStatus((err, appsOn) => {
    if (err) return cb(err);

    var activeAppList = Matrix.activeApplications.map((a) => {
      return a.name;
    });

    // turn on/off apps that are supposed to be on
    async.each(Object.keys(appsOn), (a, done) => {
      if (appsOn[a] && activeAppList.indexOf(a) === -1) {
        // this app should be on, but isn't
        startApp(a, done);
      } else if (appsOn[a] === false && activeAppList.indexOf(a) > -1 && !process.env.hasOwnProperty('START_APP')) {
        // this app shouldn't be on, but is. don't stop if start app is enabled.
        stopApp(a, done);
      } else {
        // this app is already on, or is not supposed to be on
        done();
      }
    }, err => {
      if (err) return cb(err);
      cb();
    });

  });
}

module.exports = {
  start: startApp,
  stop: stopApp,
  restart: restartApp,
  install: installApp,
  update: updateApp,
  uninstall: uninstallApp,
  clearList: clearAppList,
  killAllApps: killAllApps,
  clearAppList: clearAppList,
  getLogs: getLogs,
  cleanLogs: cleanLogs,
  getAppRecordForPid: getAppRecordForPid,
  getAppActivty: getAppActivityStatus,
  syncAppActivity: syncAppActivity,
  requestConfigs: function() {
    _.each(Matrix.activeApplications, function(child) {
      if (child.type === 'app') {
        child.send({ type: 'request-config' });
      }
    });
  },
  resetAppStatus: resetAppStatus
};