#!/usr/bin/env node
var envs = ['dev', 'production', 'rc'];

Matrix = {}; //Need to fake the global
_ = require('lodash');
var DataStore = require('nedb');
var async = require('async');
var config = require(__dirname + '/../config');
var deviceDB = new DataStore({
  filename: config.path.db.device,
  autoload: true
});

var env, id, secret;

//If an env is provided, use it
if (process.argv.length > 4 && _.includes(envs, process.argv[2])) {

  env = process.argv[2];
  id = process.argv[3];
  secret = process.argv[4];

  var insertQuery = {
    id: id,
    secret: secret,
    env: env
  }

  var findQuery = {
    id: { $exists: true },
    secret: { $exists: true },
    env: env
  }

  async.series([
    function (next) {
      deviceDB.find(findQuery, function (err, result) {
        if (err) {
          console.error('Err:', err.red);
          next(err);
        }

        if (_.isUndefined(result) || result.length < 1) {
          //console.log('Nothing to delete');
          next();
        } else {
          //console.log('Results found!', result);
          result.forEach(function (device) {
            deviceDB.remove({ _id: device._id }, function (err) {
              if (err) console.log('Unable to delete data for env', env + '!');
              next(err);
            });
          });
        }
      });
    },
    function (next) {
      console.log('Inserting...');
      deviceDB.insert(insertQuery, function (err) {
        if (err) console.log('Unable to update device data');
        else console.log('Device configuration set!');
        next(err);
      });
    }

  ], function (err) {
    if (err) console.log(err.message);
    process.exit(0);
  });
} else {
  console.log('Parameters required: node set.js <env> <id> <secret>');
  console.log('  Allowed envs: dev, rc, production');
  process.exit(1);
}