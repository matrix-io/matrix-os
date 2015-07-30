var exec = require('child_process').exec;
var expect = require('chai').expect;

describe('DNS', function() {

  it('Should be able to resolve a URL', function(done) {
    require('dns').resolve('www.google.com',done);
  });

  /*
  it('Should be able to ping backup DNS', function(done) {
    require('dns').resolve('www.google.com',done);
  });
  */

});
