/* Management for all the apps */

var r = require('request');
var fs = require('fs');

var runningList = [];

module.exports = {
  runningList: runningList,
  list: listApps,
  start: startApp,
  stop: stopApp,
  restart: restartApp,
  install: installApp,
  update: updateApp,
  uninstall: uninstallApp
};

function updateApp(){

}

function listApps() {
	//  server list = truth, this is temp

}

function startApp(name, cb) {
  // actually start app here

  var child = require('child_process').fork('./apps/' + name + '.matrix');
  console.log('start app'.blue, name, child.pid);
  runningList.push(child);

  Matrix.db.insert({ activeApplication : { name: name, pid: child.pid }});

  child.on('message', function(m) {
    console.log('app->' + name + ' [M] :', m);
    if ( m.type === 'data-point'){
      console.log('Camera Data ', m.payload.cameraData)
    }
  });

  // kick off scripts
  child.send({ init : true });

  child.on('close', function(code, number){
    log('Close:', code, number);
  });
  child.on('exit', function(code, number){
    log('Exit:', code, number);
  });
  child.on('error', function(err){
    console.error('Error', err);
  });
  cb(child);
}

function stopApp(id) {
    Matrix.db.find({ 'activeApplication.pid' : id} , function(err, resp){
      if (err) console.log(err);
      console.log(resp);
    })

  if ( parseInt(id) === id ){
  } else {
    //handle string
  }

}


function restartApp() {

}

function installApp() {

}

function uninstallApp() {

}
