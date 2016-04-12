// TODO: manager.js is a terrible name, needs fixing and refactoring


/* App Management */

var r = require('request');
var fs = require('fs');
var debug = debugLog('app');


var yaml = require('js-yaml');

function triggerHandler(data){
  debug('trigger msg> '.blue, data);
  Matrix.events.emit('app-message', data);
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

//TODO: should support all the onfig tree, not just configuration
function updateConfigKey(options, cb) {

  var fb = Matrix.service.firebase;

  var configFile = './apps/' + options.name + '.matrix/config.yaml';
  var config = yaml.loadSafe(fs.readFileSync(configFile));
  config.configuration[options.key] = options.value;
  var configJs = yaml.safeDump(config);
  fs.writeFile(configFile, configJs, cb);
}


// for dynamic messaging
function setupAppListeners(name, cb) {
  debug('app('.green + name.green + ')->listeners'.green);
  Matrix.events.on('app-' + name + '-message', cb);
  Matrix.events.on('app-message', cb);
}

// Parse Messages Sent From Apps Here
function messageHandler(msg) {
  debug('app(msg)->[M]'.green, msg, '(not implemented)'.red);

  // return msg;
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
          cb(name + ' does not have a' + 'package.json'.blue + 'file');
        }
        return null;
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

// Parse and Direct Data sent from Apps
function dataHandler(data) {
  debug('app(data)->[M]'.green, data);
  Matrix.service.stream.sendDataPoint(data.payload);
}


function startApp(name, cb) {
  // actually start app here
  if (_.isUndefined(name)) {
    return cb(new Error('Need to declare name'));
  }
  Matrix.events.emit('app-log', 'Launching: ' + name);


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


  // don't launch dupes - damn callback
  if (_.find(Matrix.activeApplications, {
    name: name
  })) {
    return error('Cannot start another instance of :', name)
  }

  // make new instance
  log(Matrix.service)
  var app = new Matrix.service.application.Application(name);

  console.log('App Config:', app.config );
  var appConfig = app.config;

  app.process = require('child_process').fork('./apps/' + name + '.matrix/index.js', [], {
    // pipes logs to parent below
    silent: true,
    // make available to app environment
    env: app.config.configuration || {}
  });

  var day = new Date().getDay();

  app.process.stdout.on('data', function writeOutLog(data) {
    // write log event to file
    var time = new Date().toISOString().slice(0, -5);
    var str = time + ' l o g [' + name + ']' + ' ' + data;
    fs.appendFile(Matrix.config.path.appLog+day, str);
    debug('(app)stdout', data.toString());

    //send out realtime update
    Matrix.events.emit('app-log', str);
  });

  app.process.stderr.on('data', function writeOutLog(data) {
    var time = new Date().toISOString().slice(0, -5);
    var str = time + ' error [' + name + ']' + ' ' + data;
    fs.appendFile(Matrix.config.path.appLog+day, str);

    error('(app)stderr', data.toString());
    Matrix.events.emit('app-log', str);
  });



  // for socket routing on reply
  Matrix.activeApplications.push(app.process);

  // for persistance
  Matrix.db.service.insert({
    activeApplication: {
      name: name,
      pid: app.process.pid
    }
  });

  // this might be useful for re-binding to the pid later on
  //TODO: Refactor as part of #113965661
  app.process.send({
    'eventType':'container-status',
    'app': name,
    'pid': app.process.pid
  }, null);

  //handle messages from apps
  app.process.on('message', function(m) {

    debug('app('.green + name.green + ')->'.green, m.type);
    debug('== app-emit'.blue, m.payload);
    //TODO: refactor #113965661
    if (m.type === 'app-emit') {

      // TODO: Hacky for demo. Type should be outside data
      // m.payload.data.type = m.payload.data.type;

      m.payload.appName = appConfig.name.toLowerCase();
      m.payload.appVersion = appConfig.version || 0;
      // Reroutes to dataHandler above via events
      Matrix.events.emit('app-emit', m);
    } else if (m.type === 'sensor-init') {
      // so we can lookup sensors on activeProcess
      if ( child.sensors.indexOf( m.name ) === -1 ){
        console.error(app.name.grey, 'application not configured for', m.name.blue, 'sensor');
      } else {
        Matrix.events.emit('sensor-init', m);
      }
    } else if (m.type === 'app-message') {

      // sending global interapp message
      Matrix.events.emit('app-message', m);

    } else if (m.type.match(/app-.*-message/)) {

      // sending specific interapp message
      Matrix.events.emit(m.type, m);

    } else if (m.type === 'app-config') {
      if ( !_.isObject(m.payload)){
        return console.error('Bad Configuration Sent. Not an Object.'.red)
      }
      _.extend(m, {
        name: m.payload.name.toLowerCase(),
        version: ( _.isNumber( m.payload.version ) ) ? m.payload.version : m.payload.version.replace(/\./g, '') || 0
      });

      _.extend(child, {
        // todo add system need to knows from config
        sensors: m.payload.sensors,
        types: m.payload.dataTypes,
        integrations: m.payload.integrations
      });

      Matrix.events.emit('app-config', m);
    } else if (m.type ==='trigger' ) {
      Matrix.events.emit('trigger-group', m);

    } else {
      warn('Invalid Process Message from Matrix', m);
    }
  });

  // send interapp events to process
  setupAppListeners(name, function(m) {
    console.log('app messaging', m);
    app.process.send(m);
  });


  app.process.on('close', function(code, number){
    debug('Close:', code, number);
    _.remove( Matrix.activeApplications, function (activeProcess) {
      return activeProcess.pid === app.process.pid;
    });
  });


  app.process.on('exit', function(code, number) {
    debug('Exit:', code, number);
    _.remove( Matrix.activeApplications, function (activeProcess) {
      return activeProcess.pid === app.process.pid;
    });
  });

  app.process.on('error', function(err) {
    error('Error', err);
  });

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
      return (p.type === 'app' && p.name === id);
    });

    _.each(Matrix.activeApplications, function(p) {
      if (p.type === 'app'){
        deadSensors = _.difference(deadSensors, p.sensors);
        // Matrix.device.sensor.stopSensor()
      }
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
  listen: setupAppListeners,
  start: startApp,
  stop: stopApp,
  restart: restartApp,
  install: installApp,
  update: updateApp,
  uninstall: uninstallApp,
  clearList: clearAppList,
  messageHandler: messageHandler,
  dataHandler: dataHandler,
  killAllApps: killAllApps,
  clearAppList: clearAppList,
  updateConfigKey: updateConfigKey,
  getLogs: getLogs,
  cleanLogs: cleanLogs,
  trigger: triggerHandler
};
