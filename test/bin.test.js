var fs = require('fs-extra');
var binPath = './bin/';
var exec = require('child_process').exec;
var DataStore = require('nedb');
var _ = require('lodash');
var config = require(__dirname + '/../config/path');
var deviceDB = new DataStore({
  filename: config.db.device,
  autoload: true
});


describe('Bin', function () {
  describe('Device config', function () {
    var deviceFilePath = './db/device.db';
    var deviceBackupFilePath = './test/test.matrix';

    before(function () {
      //Check Backup Files
      var currentFileStat, err;

      try {
        currentFileStat = fs.statSync(deviceFilePath);
      } catch (error) {
        err = error;
      }
      if (!err && currentFileStat) {
        fs.copySync(deviceFilePath, deviceBackupFilePath);
      }
    });

    // after(function () {
    //   var bkFileStat, err;
    //   //Restore Backup and remove File      
    //   try {
    //     bkFileStat = fs.statSync(deviceBackupFilePath);
    //   } catch (error) {
    //     err = error;
    //   }
    //   if (!err && bkFileStat) {
    //     fs.copySync(deviceBackupFilePath, deviceFilePath);
    //     fs.unlinkSync(deviceBackupFilePath);
    //   }
    // });
    
    describe('Reset device', function () {
      it('should reset the configuration for all environments', function (done) {
        exec('node ' + binPath + 'reset.js', function (error, stdout, stderr) {
          if (!error) {
            var query = {};
            deviceDB.find(query, function (err, result) {
              if (err) {
                done(err);
              }
              //check if there is any data left for any envs
              if (_.isUndefined(result)) {
                done();
              } else {
                done(new Error('Reset failed'));
              }
            });
          }else{
            done(error);
          }
        }); 
      });

      var env = 'dev';

      it('should reset the configuration for a specific environment', function (done) {
        exec( 'node ' + binPath + 'reset.js ' + env, function (error, stdout, stderr) {
          if (!error) {
            var query = {};
            deviceDB.find(query, function (err, result) {
              if (err) {
                done(err);
              }
              //check if there is any data left for env
              if (_.isUndefined(result)) {
                done();
              } else {
                done(error);
              }
            });
          }else{
            done(error);
          }
        }); 
      });
    });
      
    describe('Set device', function () {
      before(function () {
        //TODO Remove previous data for env
      });
      var env = 'dev';
      var id = 'ThisIsMyTestId';
      var secret = 'DeviceSecretAtItsBest';

      describe.skip('Correct command', function () {
        it('should be able to set the device configuration for a specific environment', function (done) {
          exec( 'node ' + binPath + 'set.js ' + env + ' ' + id + ' ' + secret, function (error, stdout, stderr) {
            if (!error) {
              var query = {};
              deviceDB.find(query, function (err, result) {
                if (err) {
                  done(err);
                }

                //Use NeDB find to check if there's data for that environment
                if (_.isUndefined(result)) {
                  done();
                } else {
                  done(error);
                }
              });
            }else{
              done(error);
            }
          }); 
        });
      });
      
      describe('Wrong parameters', function () {
        before(function () { 
          //TODO Remove previous data for env
        });

        it('should not set device configuration if env isn\'t dev|rc|prod', function (done) {
          exec('node ' + binPath + 'set.js ' + 'aMadeUpEnv' + ' ' + id + ' ' + secret, function (error, stdout, stderr) {
            if (!error) {
              done(error);
            }else{
              done();
            }
          }); 
        });

        it('should not set device configuration if missing env parameter', function (done) {
          exec('node ' + binPath + 'set.js ' + id + ' ' + secret, function (error, stdout, stderr) {
            if (!error) {
              done(error);
            }else{
              done();
            }
          }); 
        });

        it('should not set device configuration if missing device id', function (done) {
          exec('node ' + binPath + 'set.js ' + env + ' ' + secret, function (error, stdout, stderr) {
            if (!error) {
              done(error);
            }else{
              done();
            }
          }); 
        });

        it('should not set device configuration if missing device secret', function (done) {
          exec( 'node ' + binPath + 'set.js ' + env + ' ' + id, function (error, stdout, stderr) {
            if (!error) {
              done(error);
            }else{
              done();
            }
          }); 
        });

        it('should not set device configuration if missing multiple parameters', function (done) {
          exec('node ' + binPath + 'set.js', function (error, stdout, stderr) {
            if (!error) {
              done(error);
            }else{
              done();
            }
          }); 
        });

      });
    });
  });
});