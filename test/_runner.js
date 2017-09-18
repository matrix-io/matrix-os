var fs = require('fs'),
  path = require('path');
_ = require('lodash');
should = require('should');
assert = require('chai').assert;

var Mocha = require('mocha');
var mocha = new Mocha();


log = console.log;

// Instantiate a Mocha instance.

process.env.NODE_ENV = 'dev';
process.env.DEBUG = '*';
Matrix = require('../index.js').Matrix;


testAppAPI = function(test, cb) {
  faketrix = require('child_process').fork('./apps/test.matrix/index.js', {
    env: { TEST_MODE: true },
    // silent: true, stdio: 'ignore'
  });
  faketrix.send({ test: test });
  faketrix.on('message', function(msg) {
    faketrix.kill();
    cb(msg);
  })
}

setTimeout(function() {
  require('child_process').execSync('cp -r ./test/fixtures/test.matrix/ ./apps/test.matrix/')
  Matrix.events.on('matrix-ready', function() {
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
      Matrix.haltTheMatrix(function() {
        console.log("Woot Tests Done!~".rainbow)
          // require('child_process').execSync('rm -r ./apps/test.matrix')
      });
    });
  })
}, 500)


//Define a fn function that exposes the run function
fn = {
  run: function (cmd, options, done) {
    if (!_.isFunction(done)) {
      throw new Error('Run needs a done()');
    }
    var args = cmd.split(' ');
    var isM = cmd.split(' ').shift();
    if (isM === 'matrix') {
      // matrix included, remove
      args.shift();
    }

    if (_.isString(options.checks)) {
      options.checks = [options.checks]
    }
    // console.log(args)
    var proc = require('child_process').spawn('matrix', args);

    var responseCount = 0; //options.responses.length;
    var checkCount = 0; //options.checks.length;

    var respondPrompts = _.map(options.responses, _.first);
    // return first for regex map
    // => /name|password/
    var respondRegex = new RegExp(_.map(options.responses, _.first).join('|'));

    var targetChecks = (options.hasOwnProperty('checks')) ? options.checks.length : 0;
    var targetResps = (options.hasOwnProperty('responses')) ? options.responses.length : 0;

    // global to match multis
    var checkRegex = new RegExp(options.checks.join('|'), 'g');

    // console.log(respondRegex, checkRegex)
    //

    var output = [];
    var finished = false;

    var handleOutput = function (out) {
      out = out.toString();
      output.push(out.split('\n'))
      if (process.env.hasOwnProperty('DEBUG')) {
        console.log(out);
      }
      // called for each line of out
      var respMatch = out.match(respondRegex);
      // console.log(responseCount, '<', targetResps);
      // console.log(respMatch, out, '[]=>', respondRegex, targetResps)
      if (responseCount < targetResps && options.hasOwnProperty('responses') && !_.isNull(respMatch)) {
        var index = respondPrompts.indexOf(respMatch[0]);
        console.log(respMatch[0], index, options.responses[index][1])
        proc.stdin.write(options.responses[index][1]);
        responseCount += 1;
      }

      if (options.hasOwnProperty('checks') && !_.isNull(out.match(checkRegex))) {
        checkCount += out.match(checkRegex).length;
      }

      // console.log(responseCount, checkCount)
      if (!finished && responseCount >= targetResps && checkCount >= targetChecks) {
        finished = true;

        if (options.hasOwnProperty('postCheck')) {
          // make sure command has time to finish
          setTimeout(function () {
            // console.log('>>>Function POSTCHECK')
            options.postCheck(done, output);
          }, 100)
        } else {
          done();
        }
      }
    }
    // TODO: Debug uses stderr
    proc.stdout.on('data', handleOutput);

    // forward errors
    proc.stderr.on('data', handleOutput);

    proc.on('close', function (code) {
      console.log('finished'.green, cmd, code)
    })
  }
}