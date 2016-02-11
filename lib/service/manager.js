/* App Management */

var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;

var r = require('request');
var fs = require('fs');
var http = require('http');
var url = require('url');

var debug = debugLog('app');

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
  updateConfig: updateConfig,
  getLogs: getLogs,
  cleanLogs: cleanLogs,
  trigger: triggerHandler
};

function triggerHandler(data){
  debug('trigger msg> '.blue, data)
  Matrix.events.emit('app-message', data);
}

function getLogs(){
  return fs.readFileSync(Matrix.config.path.appLog+new Date().getDay(), 'utf8');
}

function cleanLogs(cb){
  fs.readdirSync('./apps').filter(function(f){
    // return logs, not todays log
    return ((f.indexOf('app.log') > -1) && (f.indexOf( new Date().getDay() ) === -1 ));
  }).forEach(function(f){
    fs.unlinkSync('./apps/'+f);
  });
  cb(null);
}

function updateConfig(options, cb) {
  var configFile = './apps/' + options.name + '.matrix/config.json';
  var config = JSON.parse(fs.readFileSync(configFile));
  config.configuration[options.key] = options.value;
  var configJs = require('js-beautify').js_beautify(JSON.stringify(config));
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

// Parse and Direct Data sent from Apps
function dataHandler(data) {
  debug('app(data)->[M]'.green, data);
  Matrix.service.stream.sendDataPoint(data.payload);
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
  debug('Install App'.yellow, appUrl, '->', name, version);

  var appUpdate;
  var updateFile = '/tmp/matrix_app/' + name + '-' + version + '.zip';
  var targetDir = 'apps/' + name + '.matrix/';

  if (!fs.existsSync('/tmp/matrix_app/')) {
    fs.mkdirSync('/tmp/matrix_app/');
  }

  r(appUrl).pipe(fs.createWriteStream(updateFile))
    .on('error', function(err) {
      error(err);
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
          error(name, ' does not have a', 'package.json'.blue, 'file');
          if (_.isFunction(cb)) {
            return cb('No package.json file found!');
          }
          return null;
        }
        try {
          console.log('npm install')
          var pJson = require('child_process').execSync('npm install', {
            cwd: './apps/' + name + '.matrix/'
          });
          console.log('=======', pJson.toString());
          log('App:', name, 'installed!');
        } catch (e) {
          error(e);
        }
      });
      // extract zip to /apps
      fs.createReadStream(updateFile).pipe(extract);

    });
}

function killAllApps(cb) {
  var ids = _.map(Matrix.activeProcesses, 'pid')

  if ( ids.length > 0 ){
    require('child_process').execSync('kill ' + ids.join(' '));
    Matrix.activeProcesses = [];
    debug('All active apps killed:', ids.join(' '));
  }

  cb(null);
}

function startApp(name, cb) {
  // actually start app here
  if (_.isUndefined(name)) {
    return cb(new Error('Need to declare name'));
  }
  log('Starting app:', name);


    try {
      fs.accessSync('./apps/' + name + '.matrix/config.json');
      var appConfig = JSON.parse(fs.readFileSync('./apps/' + name + '.matrix/config.json'));
    } catch (e) {
        if (_.isFunction(cb)){
          return cb('Invalid app:'.red+ name)
        } else {
          return console.error('Invalid app:'.red, name);
        }
    }


  // don't launch dupes - damn callback
  if (_.find(Matrix.activeProcesses, {
      name: name
    })) {
    return error('Cannot start another instance of :', name)
  }

  var child = require('child_process').fork('./apps/' + name + '.matrix/index.js', [], {
    // pipes logs to parent below
    silent: true
  });

  var day = new Date().getDay();

  child.stdout.on('data', function writeOutLog(data) {
    // write log event to file
    var time = new Date().toISOString().slice(0, -5);
    var str = time + ' l o g [' + name + ']' + ' ' + data;
    fs.appendFile(Matrix.config.path.appLog+day, str);
    debug('(app)stdout', data.toString());

    //send out realtime update
    Matrix.events.emit('app-log', str);
  });

  child.stderr.on('data', function writeOutLog(data) {
    var time = new Date().toISOString().slice(0, -5);
    var str = time + ' error [' + name + ']' + ' ' + data;
    fs.appendFile(Matrix.config.path.appLog+day, str);

    error('(app)stderr', data.toString());
    Matrix.events.emit('app-log', str);
  });

  _.extend(child, {
    name: name,
    sensors: []
  });

  // for socket routing on reply
  Matrix.activeProcesses.push(child);

  // for persistance
  Matrix.db.service.insert({
    activeApplication: {
      name: name,
      pid: child.pid
    }
  });

  // this might be useful for re-binding to the pid later on
  child.send({
    'app': name,
    'pid': child.pid
  }, null);

  //handle messages from apps
  child.on('message', function(m) {

    debug('app('.green + name.green + ')->'.green, m);
    if (m.type === 'app-emit') {
      console.log(m);
      // Reroutes to dataHandler here
      m.payload.appName = appConfig.name.toLowerCase();
      m.payload.appVersion = appConfig.version || 0;
      Matrix.events.emit('app-emit', m);
    } else if (m.type === 'sensor-init') {
      Matrix.events.emit('sensor-init', m);

      // so we can lookup sensors on activeProcess
      child.sensors.push(m.name);
    } else if (m.type === 'app-message') {

      // sending global interapp message
      Matrix.events.emit('app-message', m);

    } else if (m.type.match(/app-.*-message/)) {

      // sending specific interapp message
      Matrix.events.emit(m.type, m);

    } else if (m.type === 'app-config') {
      _.extend(m, {
        name: m.payload.name.toLowerCase(),
        version: m.payload.version.replace(/\./g, '') || 0
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
    child.send(m);
  });


  child.on('close', function(code, number){
    debug('Close:', code, number);
    _.remove( Matrix.activeProcesses, function (activeProcess) {
      return activeProcess.pid == child.pid;
    });
  });


  child.on('exit', function(code, number) {
    debug('Exit:', code, number);
    _.remove( Matrix.activeProcesses, function (activeProcess) {
      return activeProcess.pid == child.pid;
    });
  });

  child.on('error', function(err) {
    error('Error', err);
  });

  if (!_.isUndefined(cb)) {
    cb(null, child);
  }
}

function stopApp(id, cb) {
  debug('STOP > '.red, id);

  if (parseInt(id) === id) {
    cb(require('child_process').exec('kill ' + id));
  } else {
    Matrix.events.removeAllListeners('app-' + id + '-message');
    // log('stop %s', id);
    // handle local variable
    Matrix.activeProcesses = _.reject(Matrix.activeProcesses, function(p) {
      return (p.name == id);
    })

    //handle string
    Matrix.db.service.find({
      'activeApplication.name': id
    }, function(err, resp) {
      if (err) console.log(err);
      var pids = _.pluck(resp, 'activeApplication.pid');
      var cmd = 'kill ' + pids.join(' ');
      debug(cmd);
      var kill = require('child_process').exec(cmd);
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
  debug('restart', name);
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
  });
}
