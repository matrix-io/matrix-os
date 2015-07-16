/* Management for all the apps */

var r = require('request');

module.exports = {
  list: listApps,
  start: startApp,
  end: endApp,
  stop: stopApp,
  restart: restartApp,
  install: installApp,
  update: updateApp,
  uninstall: uninstallApp
};

function updateApp(){

}

function listApps() {
	// rely on server list

}

function startApp() {
  // actually start app here
}

function endApp() {

}

function stopApp() {

}

function restartApp() {

}

function installApp() {

}

function uninstallApp() {

}
