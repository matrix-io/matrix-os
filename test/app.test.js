//
//
describe.skip('Matrix Applications', function(){
  before(function(){
    require('child_process').execSync('cp -r '+ __dirname + '/fixtures/test.matrix/ '+ __dirname +'/../apps/test.matrix/');
    app = new Matrix.service.application.Application('test');
  })

  after(function(){
    require('child_process').execSync('rm -r '+__dirname+'/../apps/test.matrix');
  })
  describe('Lifecycle', function(){
    it('should be able to install an app')
    it('should be able to update an app')
    describe('start app', function(){

    it('should start an app by name', function(done){
      Matrix.service.manager.start('test', done);
    });
    describe('activeApplications management', function(){
      var appRecord;
      before( function(){
        appRecord = _.find( Matrix.activeApplications, { name: 'test'});
      })
      it('should save a reference to the name', function(done){
        appRecord.name.should.equal('test');
        done();
      })
      it('should save a reference to the process', function(done){
        appRecord.should.have.property('process');
        done();
      })
      it('should save a reference to the configuration', function (done) {
        appRecord.should.have.property('config');
        done();
      })
      it('should save a reference to the sensors', function (done) {
        appRecord.should.have.property('sensors');
        done();
      })
      it('should save a reference to the services', function (done) {
        appRecord.should.have.property('services');
        done();
      })
      it('should save a reference to the pid', function (done) {
        appRecord.should.have.property('pid');
        done();
      })
    })

    describe('event management', function(){
      var appRecord;
      before( function(){
        appRecord = _.find( Matrix.activeApplications, { name: 'test'});
      })
      it('should have listeners attached to process', function(done){
        appRecord.process.should.have.property('handlers');
        done();
      })

      it('should have listeners on the global event emitter', function(done){
        Matrix.events.listeners('app-message').length.should.be(1);
        Matrix.events.listeners('app-test-message').length.should.be(1);
        done();
      })
    })

    describe('stop an app',function(){
      it('should stop an app by name');
      it('should stop all apps');
      it('stopped apps should not be in activeApplications')

    })
      it('should be able to uninstall an app')
    })
  });


})
