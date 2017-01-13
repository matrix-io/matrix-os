// TODO: manager.js is a terrible name, needs fixing and refactoring


/* App Management */

var r = require('request');
var fs = require('fs');
var debug = debugLog('app');
var treeKill = require('tree-kill');
var yaml = require('js-yaml');

function getAppRecordForPid(pid){
  return _.find(Matrix.activeApplications, { pid : pid });
}

function getLogs(){
  try {
    fs.accessSync(Matrix.config.path.appLog+new Date().getDay());
    return fs.readFileSync(Matrix.config.path.appLog+new Date().getDay(), 'utf8');
  } catch (e){
    error('App Log Error:', e);
  }
}

function cleanLogs(cb){
  fs.readdirSync('./apps').filter(function(f){
    // return logs, not todays log
    return ((f.indexOf('app.log') > -1) && (f.indexOf( new Date().getDay() ) === -1 ));
  }).forEach(function(f){
    fs.unlinkSync('./apps/'+f);
  });
  if (_.isFunction(cb)){
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

/**
 * install an application. fired from firebase change right now.
 *
 * @param  {}   options          Install options
 * @param  ''   options.name     Application name
 * @param  ''   options.url      Application URL to download
 * @param  ''   options.version  SEMVER. Multiple versions are not supported.
 * @param  {Function} cb      [description]
 * @return {[type]}           [description]
 */
function installApp(options, cb) {
  debug('Install>', options )
  if ( !_.has(options,'version') || _.isUndefined(options.version) ){
    console.warn('No version provided for application install.')
    options.version = '';
  }

  if ( !_.has(options,'url') || _.isUndefined(options.url) ){
    return cb('No url provided for application install.' + options.url)
  }

  log('Install App: %s', options.name, options.version);
  debug(options.url.yellow);

  var name = options.name;
  var version = options.version;
  var url = options.url;
  var id = options.id;
  Matrix.service.firebase.app.setStatus(id, 'pending');

  if ( _.isUndefined(url)){
    cb('Application record not found');
    return;
  }
  var updateFile = '/tmp/matrix_app/' + name + '-' + version + Math.round(Math.random()*100000) + '.zip';
  var targetDir = __dirname + '/../../apps/' + name + '.matrix/';

  if (!fs.existsSync('/tmp/matrix_app/')) {
    fs.mkdirSync('/tmp/matrix_app/');
  }

  r(url).pipe(fs.createWriteStream(updateFile))
  .on('error', function(err) {
    cb('Error Retrieving URL:'+ url)
  })
  .on('close', function() {

    debug('zip download complete', url , '=>', updateFile)

    // make app directory if not made
    try {
      fs.accessSync(targetDir)
    } catch(e) {
      debug('Creating:'.green, targetDir)
      fs.mkdirSync(targetDir);
    }

    var extract = require('unzip2').Extract({
      path: targetDir
    });

    extract.on('error', function(e){
      if ( e.message.indexOf('invalid signature') > -1 ){
        console.error('Bad Zip File');
      }
      console.error('app install error', e);
      Matrix.service.firebase.app.setStatus(id, 'error');
    })

    extract.on('close', function () {
      debug('zip finished extracting')

      Matrix.service.firebase.app.setStatus(id, 'inactive');

      // don't npm install on test app installations, breaks things
      if ( process.env.hasOwnProperty('TEST_MODE') ){
        return cb();
      }

      // check for package.json
      try {
        fs.accessSync('./apps/' + name + '.matrix/package.json');
      } catch (e) {
        if (_.isFunction(cb)) {
          cb(name + ' does not have a' + 'package.json'.blue + ' file');
        }
        return null;
      }


      debug('npm install:', name)
      var pJson = require('child_process').execSync('npm install', {
        cwd: './apps/' + name + '.matrix/'
      })
      debug('App:', name, 'installed!');

      cb();

    });
    // extract zip to /apps
    debug('extracting =  =  =]', updateFile, '->', targetDir )
    fs.createReadStream(updateFile).pipe(extract);

  });
}

function killAllApps(cb) {
  _.each(Matrix.activeApplications, function (p) {
    stopApp( p.name );
  })

  if (_.isFunction(cb)){
    cb(null);
  }
}




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
    return error('Cannot start another instance of :', name)
  }


  // FIXME: this is a hack
  if ( name === 'all-applications'){
    var names = fs.readdirSync('./apps');
    names = _.filter(names, function (n) {
      return (n.indexOf('.matrix') > -1 );
    });
    log(names);
    _.each(names, function (n) {
      startApp(n.slice(0, -7), cb);
    })
    return;
  }

  var app;
  var pathToApp = './apps/' + name + '.matrix';

  var pwd = process.cwd();

  async.series([
    function makeAppInstance(cb){
      debug('creating instance:'.blue, name);
      app = new Matrix.service.application.Application(name, cb);

      // keep track of applications, route reply messages
      Matrix.activeApplications.push(app);
    },
    function startAppProcess(cb){

      debug('=== %s config === vvvv'.blue, name, app.id )
      debug(app.config);
      debug('=== %s policy === vvvv'.blue, name, app.id )
      debug(app.policy);

      //Check for app folder existance, expect the unexpected (╯°□°）╯︵ ┻━┻
      fs.access(pathToApp, function(err) {
        if (!err) {

          fs.writeFileSync(pathToApp + '/config.json', JSON.stringify(app.config));
          // TODO: Finish Docker switcheroo - Maybe only use for certian apps
          // Need to test performance
          var proc = require('child_process');
          if ( process.env.hasOwnProperty('DOCKER_APPS') ){

            try {
              var dockerImages = proc.execSync('docker images | cut -d" " -f1');
              // check for image 'matrix-apphost' in docker images
              if ( dockerImages.indexOf('matrix-apphost') === -1 ){
                // builds docker image for app hosting, see package.json
                // swaps out based on arch, arm and x64 supported
                proc.execSync('docker build -t matrix-apphost -f Dockerfile-apphost-' + process.arch)
              }

              // fire up docker image
              app.process = proc.spawn('docker', [
                'run', '-v', pwd+'/apps:/apps',
                // remove the container when exit
                '--rm',
                // reference by app name
                "--name", name,

                '-a', 'stdin', '-a', 'stdout', '-a','stderr',
                // '-t',
                '-i',
                'matrix-apphost',
                'node','apps/'+name+'.matrix/index.js'
              ], {
                stdio: ['pipe', 'pipe', 'pipe']
              });



              // app.process = proc.spawn('docker', ['run', '-v', pwd+'/apps:/apps', '--name', name, 'matrix-apphost', 'node','apps/'+name+'.matrix/index.js']);
              app.pid = app.process.pid;
              // because we're not forking, we have to stub out send
              app.process.send = function(msg){
                app.process.stdin.write(JSON.stringify(msg)+'\n');
              }

                // app.process.stdin.write(JSON.stringify({foo: 'bar'})+ '\n');
              // app.process.on('error', console.error)
              // app.process.on('message', console.log)
              // app.process.on('close', console.log)

              app.process.docker = true;
              debug('Docker App Virtualization:'.yellow, name)
            } catch (e){
              cb(new Error('Docker Error: ' + e ));
            } finally {
              cb();
            }

          } else {


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


    function setupInboundMessaging(cb){
      debug('handle events:'.blue, name);

      // route interapp events to process
      var ct = Matrix.event.app.setupCrosstalk(name, function(m) {
        debug('[M]>(CT)>app(',name, m);

        // send to application process
        app.process.send(m);

      });

      // handle CV routing back to apps
      var cv = Matrix.event.app.setupCVHandlers(name, function(err, m){
        if(err) return console.error(err);
        debug('[CV]>', m)
        m.eventType = 'detection';
        app.process.send(m);
      })

      app.process.handlers = {
        cv: cv,
        crosstalk: ct
      };


      cb();

    },

    function setupLocalAppManagement(cb){

      // when config changes, restart app
      Matrix.service.firebase.app.watchConfig(app.appId, function(){
        restartApp( name );
      })

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

    function fireOffConfigurationServices(cb){
      debug('execute configuration:'.blue, name);


      //traverse configuration for VES

      _.forIn(app.config.services, function(v,k){
        var svcName = k;
        var ng = v.engine;
        var ngp = v.engineParams;

        //TODO:
        console.warn('TODO: Should start VES for ', v.engine)

        // start VES
        // Matrix.service.ves.spawn(Matrix.userId, Matrix.deviceRecordId, Matrix.deviceSecret, {
        //   engine: ng,
        //   options: ngp,
        //   type: svcName
        // });

        //TODO: add handler for ng return via mxss
      });

      cb();
    },
    function handleAppOutbound(cb){
      debug('set up messaging:'.blue, name);
      debug('==> %s pid %s '.blue, name, app.pid)

      // Relay App Logging into Sockets
      if ( app.process.docker !== true){
        app.process.stdout.on('data', function writeOutLog(data) {
          // write log event to file
          var day = new Date().getDay();
          var time = new Date().toISOString().slice(0, -5);
          var str = time + ' l o g [' + name + ']' + ' ' + data;
          fs.appendFile(Matrix.config.path.appLog+day, str);
          debug('('+name.yellow+')', data.toString());

          //send out realtime update
          Matrix.events.emit('app-log', str);
        });

      } else {
        app.process.stdout.on('data', function writeOutDockerLog(data) {
          let msgs = [];
          try {
            data.toString().split('\n').map((m) => { if ( !_.isEmpty(m) ) msgs.push(JSON.parse(m + '\n')); })
          } catch (e) {
            console.error('Docker STDOUT Error:', e, data.toString(),'|||')
          } finally {
            msgs.forEach((m)=>{
              app.process.emit('message', m);
            })
          }
        });
      }

      // Relay App Logging into Sockets
      app.process.stderr.on('data', function writeOutError(data) {
        var day = new Date().getDay();
        var time = new Date().toISOString().slice(0, -5);
        var str = time + ' error [' + name + ']' + ' ' + data;
        // fs.appendFile(Matrix.config.path.appLog+day, str);

        app.setRuntimeStatus('error');

        error('('+name+')err'.red, data.toString());
        Matrix.events.emit('app-log', str);

        // stop the app on error
        stopApp(name)
      });

      //handle messages from apps
      app.process.on('message', Matrix.event.app.messageProcessHandler );
      app.process.on('close', Matrix.event.app.closeProcessHandler );
      app.process.on('exit', Matrix.event.app.exitProcessHandler );

      app.process.on('error', function(err) {
        error('Error', err);
      });


      cb();

    },
  ], function(err){
    if (err) {
      app.setRuntimeStatus('error');
      return err.hasOwnProperty('message') ? console.log(err.message.red) : console.log(err);
    }
    console.log('==== Application %s started! ==== '.yellow, name);

    // Updates firebase deviceapps/ install record
    app.setRuntimeStatus('active');

    // matrix process good to go
    app.process.send({
      'eventType':'container-ready',
      'app': name,
      'pid': app.process.pid
    }, null);

    if (!_.isUndefined(cb)) {
      cb(null, app);
    }
  })

}
// id can be pid or appname
function stopApp(id, cb) {
  var error;
  log('Stopping'.red, id);

  if (id === 'all-applications'){
    killAllApps(cb);
  } else if (parseInt(id) === id) {
    cb(require('child_process').exec('kill ' + id));
  } else {
    // id == app name
    Matrix.events.removeAllListeners('app-' + id + '-message');
    // log('stop %s', id);
    // handle local variable

    var applicationInstance = _.find(Matrix.activeApplications, function(p) {
      return (p.name === id);
    })

    if ( _.isUndefined(applicationInstance)){
      debug('Application Stopped No Longer In activeApplications', id);
      return;
    }

    if ( applicationInstance.hasOwnProperty('process') && applicationInstance.process.docker === true ){
      debug('stopping docker for ', id)
      require('child_process' ).execSync('docker stop '+ id);
    }

    //If the application was already started
    if (!_.isUndefined(applicationInstance)) {
      applicationInstance.setRuntimeStatus('inactive');

      // heads will roll o/ |o| \8/
      (function executioner() { treeKill(applicationInstance.pid) })();

    } else {
      console.warn('Application instance not available', id);
      error = new Error('Application ' + id + ' wasn\'t started');
    }

    //remove app from process list
    Matrix.activeApplications = _.reject(Matrix.activeApplications, function(p) {
      return (p.name === id);
    });

    if (_.isFunction(cb)) cb();
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
  rmrf('apps/' + name + '.matrix', function(err){
    if (err) error(err);
    log('Uninstalled', name);
    if ( _.isFunction(cb) ) cb();
  });
}

function resetAppStatus(cb){
    debug('Stop all apps...'.green);
    //Retrieve status for each app
    async.each(Object.keys(Matrix.localApps), function (appId, done) {
      Matrix.service.firebase.app.getStatus(appId, function (status) {
         //Set default status to inactive
        if (_.isUndefined(status)) status = "inactive";
        //If the status is active set online false and status inactive on the app
        if(status === "active"){
          Matrix.service.firebase.app.setOnline(appId, false);
          Matrix.service.firebase.app.setStatus(appId, 'inactive');
        }
        done();
      });
    }, function(err) {
      if (err) console.error(err);
      if ( _.isFunction(cb) ) cb();
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
  requestConfigs: function(){
    _.each(Matrix.activeApplications, function(child){
      if (child.type === 'app'){
        child.send({ type: 'request-config' });
      }
    })
  },
  resetAppStatus: resetAppStatus
};
