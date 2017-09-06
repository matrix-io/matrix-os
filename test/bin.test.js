var fs = require('fs-extra');
var binPath = './bin/';
describe.skip('Bin', function () {
  describe('Device config', function () {
    var deviceFilePath = './db/device.db';
    var deviceBackupFilePath = './test/test.matrix';

    before(function () {
      //Check Backup Files
      /*var currentFileStat, bkFileStat, err;

      try {
        currentFileStat = fs.statSync();
      } catch (error) {
        err = error;
      }

      if (!err && currentFileStat) {
        fs.copySync(deviceFilePath, deviceBackupFilePath);
      }

      */
    });
      //exec('git fetch && git pull', function (error, stdout, stderr) {
    describe('Reset device', function () {
      it('should reset the configuration for all environments', function (done) {
        fn.run(
          'node ' + binPath + '/reset.js', { checks: ['Successful device data reset!'] }
          , function (err) { 
            if (!err) {
              //TODO check if there is any data left for any envs
            }
            done(err);
          }
        );
      });

      var env = 'dev';
      it('should reset the configuration for a specific environment', function (done) {
        fn.run(
          'node ' + binPath + '/reset.js ' + env, { checks: ['Successful device data reset for environement', env + '!'] }
          , function (err) { 
            if (!err) {
              //TODO check if there is any data left for env
            }
            done(err);
          }
        );
      });
    });
      
    describe('Set device', function () {
      before(function () {
        //TODO Remove previous data for env
      });
      var env = 'dev';
      var id = 'ThisIsMyTestId';
      var secret = 'DeviceSecretAtItsBest';

      describe('Correct command', function () {
        it('should be able to set the device configuration for a specific environment', function (done) {
          done();
        });
        
      });
      
      describe('Wrong parameters', function () {
        before(function () { 
          //TODO Remove previous data for env
        });

        it('should not set device configuration if env isn\'t dev|rc|prod', function (done) {
          fn.run(
            'node ' + binPath + '/set.js ' + 'aMadeUpEnv' + ' ' + id + ' ' + secret, { checks: ['Parameters required'] }
            , function (err) {
              if (!err) {
                //TODO Confirm no data was set for env
              }
              done(err);
            }
          );
        });

        it('should not set device configuration if missing env parameter', function (done) {
          fn.run(
            'node ' + binPath + '/set.js ' + id + ' ' + secret, { checks: ['Parameters required'] }
            , function (err) {
              if (!err) {
                //TODO Confirm no data was set for env
              }
              done(err);
            }
          );
        });

        it('should not set device configuration if missing device id', function (done) {
          fn.run(
            'node ' + binPath + '/set.js ' + env + ' ' + secret, { checks: ['Parameters required'] }
            , function (err) {
              if (!err) {
                //TODO Confirm no data was set for env
              }
              done(err);
            }
          );
        });

        it('should not set device configuration if missing device secret', function (done) {
          fn.run(
            'node ' + binPath + '/set.js ' + env + ' ' + id, { checks: ['Parameters required'] }
            , function (err) {
              if (!err) {
                //TODO Confirm no data was set for env
              }
              done(err);
            }
          );
        });

        it('should not set device configuration if missing multiple parameters', function (done) {
          fn.run(
            'node ' + binPath + '/set.js', { checks: ['Parameters required'] }
            , function (err) {
              if (!err) {
                //TODO Confirm no data was set for env
              }
              done(err);
            }
          );
        });
      });
    });
  });
});