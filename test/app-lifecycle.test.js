var fs = require('fs-extra');
var Matrix = require('../app').Matrix;
var should = require('should');



describe('Matrix<->App', function() {
  var pid, child;
  this.timeout(15000)
  before(function() {
      fs.copySync('./test/test.matrix', './apps/test.matrix');
    })
    // after(function(){
    //   //teardown
    //   fs.removeSync('./apps/test.matrix');
    // });
  describe('Matrix.service.manager[]', function() {

    it('[start] an app', function(done) {
      Matrix.service.manager.start('test', function(err, proc) {
        proc.pid.should.be.ok();
        pid = proc.pid;
        child = child;
        done();
      });
    });
    it('[listen] should bind an event', function(done){
      Matrix.service.manager.listen('test', done);
      Matrix.events.emit('app-test');
    });

    //described in test.matrix
    describe('test app should', function(){
      it('emits a message');
      it('emits a sensor-init')
      it('emits a data-point');

    });

    it('[stop] an app', function(done) {
      Matrix.service.manager.stop(pid, function() {
        done();
      });
    })
    it('[install] will install an app')
    it('[uninstall] will uninstall an app')
    it('[update] will update an app')
    it('[update] will update an app')
  });





});
