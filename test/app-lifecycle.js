var fs = require('fs-extra');
var Matrix = require('../app').Matrix;
var should = require('should');

describe('Matrix<->App', function(){
  var pid;
  before(function () {
    fs.copySync('./test/test.matrix', './apps/test.matrix');
  })
  // after(function(){
  //   //teardown
  //   fs.removeSync('./apps/test.matrix');
  // });
  describe('Matrix.service.manager[]', function(){

  it('[start] will start an app', function(done){
    Matrix.service.manager.start('test', function(err, proc){
      proc.pid.should.be.ok();
      pid = proc.pid;
      done();
    });
  });
  it('Matrix.stop can stop an app', function(done){
    Matrix.service.manager.stop(pid, function(){
      done();
    });
  })
  it('Matrix.')
  })

});
