/* Management for all the apps */

var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;

var r = require('request');
var fs = require('fs');

var runningList = [];

module.exports = {
  runningList: runningList,
  list: listApps,
  listen: listenApp,
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

function listenApp(name, cb){
  Matrix.events.on('app-'+ name, cb);
}

function messageHandler(msg){
  // Parse Messages Sent From Apps Here
  console.log('app->[M]'.blue, 'message', msg)
  // add filter
  // socket request
  return msg;
}

function dataHandler(data){
  console.log('app->[M]'.blue, 'data', data)
  // Parse and Direct Data sent from Apps
  // Send to API as deemed necessary
  // <--- Filter here
  var filteredData = [];

}

function clearAppList(){
  Matrix.db.remove({'activeApplication': { $exists: true }}, {multi: true});
}

function updateApp(){

}

function listApps() {
	//  server list = truth, this is temp

}

function startApp(name, cb) {
  // actually start app here

  //TODO: implement check for dupe named apps

  if (_.isUndefined(name)){
    return cb(new Error('Need to declare name'));
  }

  var child = require('child_process').fork('./apps/' + name + '.matrix/index.js' );
  // console.log('start app'.blue, name, 'pid'.blue, child.pid);

  _.extend(child, {name: name});

  // for socket routing
  Matrix.activeProcesses.push(child);

  // for persistance
  Matrix.db.insert({ activeApplication : { name: name, pid: child.pid }});

  child.on('message', function(m) {
    console.log('app>'.blue, m);
    if ( m.type === 'data-point'){
      Matrix.events.emit('handle-app-data', m);
    } else if (m.type === 'sensor-init') {
      Matrix.events.emit('sensor-init', m)
    } else if (m.type === 'utility'){
      Matrix.events.emit('handle-app-message', m);
    }
  });

  // kick off scripts
  // child.send({ type: 'sensor-event', payload: { poop: true } });

  child.on('close', function(code, number){
    // log('Close:', code, number);
  });
  child.on('exit', function(code, number){
    // log('Exit:', code, number);
  });
  child.on('error', function(err){
    console.error('Error', err);
  });
  cb(null, child);
}

function stopApp(id, cb) {
  // console.log('STOP!'.red);

  if ( parseInt(id) === id ){
    cb( require('child_process').exec('kill '+ id ) );
  } else {
    log('stop %s', id)
    //handle string
    //
    Matrix.db.find({ 'activeApplication.name' : id} , function(err, resp){
     if (err) console.log(err);
     var pids = _.pluck(resp, 'activeApplication.pid');
     var  cmd = 'kill ' + pids.join(' ');
     log(cmd);
     var kill = require('child_process').exec(cmd);
     cb(Matrix.db.remove({ 'activeApplication.pid': { $in : pids }}));
   })
  }

}


function restartApp() {

}

function installApp() {

}

function uninstallApp() {

}
