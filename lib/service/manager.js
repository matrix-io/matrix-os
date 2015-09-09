/* App Management */

var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;

var r = require('request');
var fs = require('fs');
var http = require('http');
var url = require('url');

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
  dataHandler: dataHandler
};

// for dynamic messaging
function setupAppListeners(name, cb) {
  Matrix.events.on('app-' + name + '-message', cb);
  Matrix.events.on('app-message', cb);
}

// Parse Messages Sent From Apps Here
function messageHandler(msg) {
  console.log('app(msg)->[M]'.green, msg, '(not implemented)'.red);

  // return msg;
}

// Parse and Direct Data sent from Apps
function dataHandler(data) {
  console.log('app(data)->[M]'.green, data);
  Matrix.service.stream.sendDataPoint(data.payload);
}

function clearAppList() {
  Matrix.db.service.remove({
    activeApplication: {
      $exists: true
    }
  }, {
    multi: true
  });
}

function installApp(appUrl, name, version, cb) {

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
      log('file done');

      // make app directory if not made
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
      }

      // extract zip to /apps
      fs.createReadStream(updateFile).pipe(require('unzip').Extract({ path: targetDir }));

    })
}

function startApp(name, cb) {
  // actually start app here

  //TODO: implement check for dupe named apps

  if (_.isUndefined(name)) {
    return cb(new Error('Need to declare name'));
  }

  var child = require('child_process').fork('./apps/' + name + '.matrix/index.js');

  // console.log('start app'.blue, name, 'pid'.blue, child.pid);

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

  //handle messages from apps
  child.on('message', function(m) {
    console.log('app>[M]'.green, m);
    if (m.type === 'sensor-emit') {
      // Reroutes to dataHandler here
      Matrix.events.emit('app-emit', m);
    } else if (m.type === 'sensor-init') {
      Matrix.events.emit('sensor-init', m);

      // so we can lookup sensors on activeProcess
      child.sensors.push(m.name);
    } else if ( m.type === 'app-message'){

      // sending global interapp message
      Matrix.events.emit('app-message', m);

    } else if ( m.type.match(/app-.*-message/)){

      // sending specific interapp message
      Matrix.events.emit(m.type, m);

    } else {
      console.warn('Invalid Process Message from Matrix', m);
    }
  });

  // send interapp events to process
  setupAppListeners(name, function(m){
    child.send(m);
  });


  child.on('close', function(code, number) {
    // log('Close:', code, number);
  });

  child.on('exit', function(code, number) {
    // log('Exit:', code, number);
  });

  child.on('error', function(err) {
    console.error('Error', err);
  });

  if (!_.isUndefined(cb)) {
    cb(null, child);
  }
}

function stopApp(id, cb) {
  // console.log('STOP > '.red, id);

  if (parseInt(id) === id) {
    cb(require('child_process').exec('kill ' + id));
  } else {
    log('stop %s', id);

    //handle string
    Matrix.db.service.find({
      'activeApplication.name': id
    }, function(err, resp) {
      if (err) console.log(err);
      var pids = _.pluck(resp, 'activeApplication.pid');
      var cmd = 'kill ' + pids.join(' ');
      log(cmd);
      var kill = require('child_process').exec(cmd);
      Matrix.db.service.remove({
        'activeApplication.pid': {
          $in: pids
        }
      });
      cb();
    });
  }
}

function restartApp(name, cb) {
  stopApp(name, function(){
    startApp(name, cb);
  });
}

function updateApp(){
  // installApp( appUrl, name, version, cb )
}

function uninstallApp(name, cb) {
  fs.rmdir('apps/' + name + '.matrix', cb);
}
