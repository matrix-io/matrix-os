//
//
describe('Matrix Applications', function() {
  before(function() {
    require('child_process').execSync('cp -r ' + __dirname + '/fixtures/test.matrix/ ' + __dirname + '/../apps/test.matrix/');
  });

  describe('Lifecycle', function() {
    // it('should be able to install an app')
    it('should be able to update an app');
    describe('start app', function() {

      it('should start an app by name', function(done) {
        Matrix.service.manager.start('test', done);
      });
      describe('activeApplications management', function() {
        var appRecord;
        before(function() {
          appRecord = _.find(Matrix.activeApplications, { name: 'test' });
        });
        it('should save a reference to the name', function(done) {
          appRecord.name.should.equal('test');
          done();
        });
        it('should save a reference to the process', function(done) {
          appRecord.should.have.property('process');
          done();
        });
        it('should save a reference to the configuration', function(done) {
          appRecord.should.have.property('config');
          appRecord.config.name.should.equal('test');
          done();
        });
        it('should save a reference to the sensors', function(done) {
          appRecord.should.have.property('sensors');
          appRecord.sensors[0].should.equal('temperature');
          done();
        });
        it('should save a reference to the services', function(done) {
          appRecord.should.have.property('services');
          appRecord.services.should.have.property('faceSvc');
          appRecord.services.faceSvc.should.have.keys('engine', 'type');
          done();
        });
        it('should save a reference to the pid', function(done) {
          appRecord.should.have.property('pid');
          done();
        });
      });


      describe('event management', function() {
        var appRecord;
        before(function() {
          appRecord = _.find(Matrix.activeApplications, { name: 'test' });
        });

        it('should have listeners attached to process', function(done) {
          appRecord.process.should.have.property('handlers');
          done();
        });


        it('should have listeners on the global event emitter for crosstalk', function(done) {
          if (Matrix.events.hasOwnProperty('eventNames')) {
            // Node 6+
            Matrix.events.eventNames().should.matchAny(/app-message|app-test-message/);
          } else {
            // Node <5
            Matrix.events.listeners('app-message').length.should.equal(1);
            Matrix.events.listeners('app-test-message').length.should.equal(1);
          }
          done();
        });

        it.only('should rate limit app.send() events', function(done){
          testAppApi('rate-test');
          this.timeout(6000);
          setInterval(function(){
            console.log(Matrix.rateCache);
          }, 1000);
          setTimeout(done, 5000);
        });
      });

      describe('stop an app and manage applications', function() {

        before(function(done) {
          Matrix.service.manager.stop('test', done);
        });
        it('stopped apps should not be in activeApplications', function() {
          var appRecord = _.find(Matrix.activeApplications, { name: 'test' });
          assert(typeof appRecord, 'undefined');
        });

      });

      describe('able to synchronize application state', function() {
        // this does not have a firebase record
        before(function(done) {
          Matrix.service.manager.start('test', (err, app) => {
            if (err) return done(err);
            var pid = app.pid;
            require('child_process').execSync('kill -9 ' + pid);
            done();
          });
        });
        before(function(done) {
          Matrix.service.manager.syncAppActivity(done);
        });
        it('should restart applications which are active in firebase', function() {
          assert.equal(Matrix.activeApplications.length, 1);
        });
        after(function(done) {
          Matrix.service.manager.stop('test', done);
        });
      });

      // this does strange things in travis, it seems to be unable to find the test file
      // removing for now
      describe.skip('crash management', function() {
        var appRecord;
        this.timeout(5000);
        before(function(done) {
          Matrix.service.manager.start('test', done);
        });
        it('should remove an app from activeApplications on crash', function(done) {
          appRecord = _.find(Matrix.activeApplications, { name: 'test' });
          appRecord.process.send({ test: 'crash' });
          setTimeout(function() {
            appRecord = _.find(Matrix.activeApplications, { name: 'test' });
            console.log(Matrix.activeApplications);
            assert(typeof appRecord, 'undefined');
            done();
          }, 500);
        });
      });


    });


  });
  after(function() {
    require('child_process').execSync('rm -r ' + __dirname + '/../apps/test.matrix');
  });
});