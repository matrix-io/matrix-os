//
//
describe('Matrix Applications', function(){
  describe('Lifecycle', function(){
    // it('should be able to install an app')
    it('should be able to update an app')
    describe('start app', function(){

      it('should start an app by name', function(done){
        Matrix.service.manager.start('test', done);
      });
      describe('activeApplications management', function(){
        var appRecord;
        before( function(){
          appRecord = _.find( Matrix.activeApplications, { name: 'test'});
          console.log(appRecord)
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
          appRecord.config.name.should.equal('test');
          done();
        })
        it('should save a reference to the sensors', function (done) {
          appRecord.should.have.property('sensors');
          appRecord.sensors[0].should.equal('temperature')
          done();
        })
        it('should save a reference to the services', function (done) {
          appRecord.should.have.property('services');
          appRecord.services.should.have.keys('faceSvc');
          appRecord.services.faceSvc.should.have.keys('engine', 'type')
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
        });


        it('should have listeners on the global event emitter for crosstalk', function(done){
          Matrix.events.eventNames().should.matchAny(/app-message|app-test-message/);
          done();
        })
      })

      describe('stop an app',function(){
        it('should stop an app by name', function(done){
          Matrix.service.manager.stop('test', done)
        });
        it('should stop all apps');
        it('stopped apps should not be in activeApplications', function(){
          var appRecord = _.find( Matrix.activeApplications, { name: 'test'});
          assert(typeof appRecord, 'undefined')
        })

      })

    });


  })
});
