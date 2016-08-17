// TODO: manager.js is a terrible name, needs fixing and refactoring


/* App Management */

var r = require('request');
var fs = require('fs');
var debug = debugLog('app');


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

function installApp(appUrl, name, version, cb) {
  log('Install App: %s', name, version || '');
  debug(appUrl.yellow);

  if ( _.isUndefined(appUrl)){
    cb('Application record not found');
    return
  }
  var updateFile = '/tmp/matrix_app/' + name + '-' + version + '.zip';
  var targetDir = 'apps/' + name + '.matrix/';

  if (!fs.existsSync('/tmp/matrix_app/')) {
    fs.mkdirSync('/tmp/matrix_app/');
  }

  r(appUrl).pipe(fs.createWriteStream(updateFile))
  .on('error', function(err) {
    cb('Error Retrieving URL:'+ appUrl)
  })
  .on('close', function() {
    debug('downloaded', updateFile, '->', targetDir )

    // make app directory if not made
    try {
      fs.accessSync(targetDir)
    } catch(e) {
      debug('Creating:'.green, targetDir)
      fs.mkdirSync(targetDir);
    }

    var extract = require('unzip').Extract({
      path: targetDir
    });

    extract.on('close', function () {
      // check for package.json
      try {
        fs.accessSync('./apps/' + name + '.matrix/package.json');
      } catch (e) {
        if (_.isFunction(cb)) {
          cb(name + ' does not have a' + 'package.json'.blue + ' file');
        }
        return null;
      }

      try {
        fs.accessSync('./apps/' + name + '.matrix/config.yaml');
      } catch (e) {
        if (_.isFunction(cb)) {
          cb(name + ' does not have a' + 'config.yaml'.blue + ' file'+ e);
        }
        return null;
      }

      // add config to firebase
      try {
        var config = require('matrix-app-config-helper').read('./apps/' + name + '.matrix/config.yaml');
        Matrix.service.firebase.app.add( name, config );
      } catch (e){
        return console.error( 'hi', e, e.stack )
      }

      try {
        debug('npm install:', name)
        var pJson = require('child_process').execSync('npm install', {
          cwd: './apps/' + name + '.matrix/'
        });
        console.log('=======', pJson.toString());
        debug('App:', name, 'installed!');
      } catch (e) {
        cb(e);
      }
    });
    // extract zip to /apps
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

  async.series([
    function makeAppInstance(cb){
      debug('creating instance:'.blue, name);
      app = new Matrix.service.application.Application(name, cb);


      // for socket routing on reply
      Matrix.activeApplications.push(app);

    },
    function startAppProcess(cb){
      debug('starting process:'.blue, name);

      app.sensors = app.config.sensors;
      app.detections = _.map(app.config.services, function(s){
        var zones = _.values(s.engineParams.zones);
        return { detection: s.engine, zones:zones };
      })


      debug('=== %s config === vvvv'.blue, name)
      debug(app.config);

      fs.writeFileSync('./apps/' + name + '.matrix/config.json', JSON.stringify(app.config));

      // todo:
      app.process = require('child_process').fork('./apps/' + name + '.matrix/index.js', [], {
        // pipes logs to parent below
        silent: true,
        // make available to app environment
        // env: app.config || {}
      });

      app.pid = app.process.pid;
      cb();
    },
    function handleAppMessaging(cb){
      debug('set up messaging:'.blue, name);
      debug('==> %s pid %s '.blue, name, app.pid)

      // Relay App Logging into Sockets
      app.process.stdout.on('data', function writeOutLog(data) {
        // write log event to file
        var day = new Date().getDay();
        var time = new Date().toISOString().slice(0, -5);
        var str = time + ' l o g [' + name + ']' + ' ' + data;
        fs.appendFile(Matrix.config.path.appLog+day, str);
        debug('(app)stdout', data.toString());

        //send out realtime update
        Matrix.events.emit('app-log', str);
      });

      // Relay App Logging into Sockets
      app.process.stderr.on('data', function writeOutError(data) {
        var day = new Date().getDay();
        var time = new Date().toISOString().slice(0, -5);
        var str = time + ' error [' + name + ']' + ' ' + data;
        fs.appendFile(Matrix.config.path.appLog+day, str);

        error('(app)stderr', data.toString());
        Matrix.events.emit('app-log', str);
      });

      //handle messages from apps
      app.process.on('message', Matrix.event.app.messageProcessHandler );
      app.process.on('close', Matrix.event.app.closeProcessHandler );
      app.process.on('exit', Matrix.event.app.exitProcessHandler );

      app.process.on('error', function(err) {
        error('Error', err);
      });

      cb();

    }, function setupAppEventHandlers(cb){
      debug('handle events:'.blue, name);

      // route interapp events to process
      Matrix.event.app.setupCrosstalk(name, function(m) {
        debug('[M]>(CT)>app(',name, m);
        // send to events
        app.process.send(m);

        //send to infrastructure
        Matrix.service.stream.sendAppMessage({
          data: m,
          appName: name,
          appVersion: app.config.version
        });
      });

      // handle CV routing back to apps
      Matrix.event.app.setupCVHandlers(name, function(err, m){
        if(err) return console.error(err);
        debug('[CV]>', m)
        m.eventType = 'detection';
        app.process.send(m);
      })

      //restart apps when config changes
      Matrix.service.firebase.app.onChange( Matrix.deviceId, app.name, function(){
        restartApp(app.name);
      });

      cb();

    }, function setupLocalAppManagement(cb){
      debug('local app manager setup:'.blue, name);



      // for restarting active apps //TODO: Not complete
      Matrix.db.service.insert({
        activeApplication: {
          name: name,
          pid: app.process.pid
        }
      });

      app.process.send({
        'eventType':'container-status',
        'app': name,
        'pid': app.process.pid
      }, null);

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
    }
  ], function(err){
    if (err) return console.log(err);
    console.log('==== Application %s started! ==== '.yellow, name);
  })
  // make new instance


  // this might be useful for re-binding to the pid later on
  //TODO: Refactor as part of #113965661






  if (!_.isUndefined(cb)) {
    cb(null, app);
  }
}

function stopApp(id, cb) {
  log('Stopping'.red, id);

  if (id === 'all-applications'){
    killAllApps(cb);
  } else if (parseInt(id) === id) {
    cb(require('child_process').exec('kill ' + id));
  } else {
    Matrix.events.removeAllListeners('app-' + id + '-message');
    // log('stop %s', id);
    // handle local variable

    //get list of sensors this app uses
    var deadSensors = _.find(Matrix.activeApplications, { name: id }).sensors;

    //remove app from process list
    Matrix.activeApplications = _.reject(Matrix.activeApplications, function(p) {
      return (p.name === id);
    });

    _.each(Matrix.activeApplications, function(p) {
      deadSensors = _.difference(deadSensors, p.sensors);
    })
    //TODO: remove deadSensors that aren't being used by others


    //handle string
    Matrix.db.service.find({
      'activeApplication.name': id
    }, function(err, resp) {
      if (err) console.log(err);
      var pids = _.pluck(resp, 'activeApplication.pid');
      var cmd = 'kill ' + pids.join(' ');
      debug(cmd);

      // heads will roll o/ |o| \8/
      (function executioner() {require('child_process').exec(cmd)})();

      Matrix.db.service.remove({
        'activeApplication.name': id
      }, {
        multi: true
      }, function(err, num) {
        if (err) console.error(err);
        debug('Removed', num, 'application records');
      });
      if (cb) cb();
    });
  }
}

function restartApp(name, cb) {
  log('restart', name);
  stopApp(name, function() {
    startApp(name, cb);
  });
}

function updateApp() {
  // installApp( appUrl, name, version, cb )
}

function uninstallApp(name, cb) {
  var rmrf = require('rimraf');
  rmrf('apps/' + name + '.matrix', function(err){
    if (err) error(err);
    log('Uninstalled', name);
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
  }
};
