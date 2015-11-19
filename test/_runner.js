var Mocha = require('mocha'),
  fs = require('fs'),
  path = require('path');
_ = require('lodash');
Matrix = require('../app').Matrix;

// Instantiate a Mocha instance.
var mocha = new Mocha({ui: 'should'});

var testDir = __dirname;

// Add each .js file to the mocha instance
fs.readdirSync(testDir).filter(function(file) {
  // Only keep the .js files
  return file.substr(-7) === 'test.js';

}).forEach(function(file) {
  console.log(file);
  mocha.addFile(
    path.join(testDir, file)
  );
});

// Run the tests.
mocha.run(function(failures) {
  process.on('exit', function() {
    process.exit(failures);
  });
});
