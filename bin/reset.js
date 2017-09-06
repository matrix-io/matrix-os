#!/usr/bin/env node
var envs = ['dev', 'prod', 'rc'];

Matrix = {}; //Need to fake the global
_ = require('lodash');
var DataStore = require('nedb');
var config = require(__dirname + '/../config');
var deviceDB = new DataStore({
  filename: config.path.db.device,
  autoload: true
});

var env;
var query = {
  id: { $exists: true },
  secret: { $exists: true }
}

//If an env is provided, use it
if (process.argv.length > 2 && _.includes(envs, process.argv[2])) {
  env = process.argv[2];
  query.env = env; //Add specific environment if found
}

deviceDB.find(query, function (err, result) {
  if (err) {
    console.error('Err:', err.red);
    process.exit(1);
  }

  if (_.isUndefined(result)) {
    console.log('Nothing to reset');
  } else {
    result.forEach(function (device) {
      deviceDB.remove({ _id: device._id }, function (err, result) {
        if (!err) {
          if (_.isUndefined(env)) {
            console.log('Successful device data reset!');
          } else {
            console.log('Successful device data reset for environement', env + '!');
          }
        }
      });
    });
  }
});