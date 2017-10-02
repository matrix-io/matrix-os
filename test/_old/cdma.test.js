var exec = require('child_process').exec;
var expect = require('chai').expect;

describe('CDMA', function() {

   it('Should have the CDMA Service running', function(done){
      // exec('ps -fea | grep gpsd | grep -v grep', function(error, stdout, stderr, command) {
      //   expect(stdout.indexOf('gpsd')).to.be.above(-1);
        done();
      // });
    });


    it('Should have acquired signal', function(done){
      done();
    });
});
