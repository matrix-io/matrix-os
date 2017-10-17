

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

