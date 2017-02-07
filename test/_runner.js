var fs = require('fs'),
path = require('path');
_ = require('lodash');
should = require('should');
assert = require('chai').assert;

var Mocha = require('mocha');
var mocha = new Mocha();


log=console.log;

// Instantiate a Mocha instance.

process.env.NODE_ENV = 'dev';
process.env.DEBUG = '*';
Matrix = require('../index.js').Matrix;


testAppAPI = function(test, cb){
  faketrix = require('child_process').fork('./apps/test.matrix/index.js', { env: { TEST_MODE: true },
  // silent: true, stdio: 'ignore'
});
  faketrix.send({ test: test });
  faketrix.on('message', function (msg) {
    faketrix.kill();
    cb(msg);
  })
}


setTimeout(function(){
  require('child_process').execSync('cp -r ./test/fixtures/test.matrix/ ./apps/test.matrix/')
  Matrix.events.on('matrix-ready', function(){
    var testDir = __dirname;

    log('ready')

    // Add each .js file to the mocha instance
    fs.readdirSync(testDir).filter(function(file) {
      // Only keep the .js files
      return file.substr(-7) === 'test.js';

    }).forEach(function(file) {
      console.log('Test Loading', file);
      mocha.addFile(
        path.join(testDir, file)
      );
    });

    // Run the tests.
    mocha.run(function(failures) {
      process.on('exit', function() {
        process.exit(failures);
      });
      Matrix.haltTheMatrix(function(){
        console.log("Woot Tests Done!~".rainbow)
        require('child_process').execSync('rm -r ./apps/test.matrix')
      });
    });
  })
}, 500 )
