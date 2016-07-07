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
    it('should start an app by name', function(done){
      Matrix.service.manager.start('test', done);
    });
    describe('activeApplications', function(){
      var appRecord;
      before( function(){
        appRecord = _.filter( Matrix.activeApplications, { name: 'test'});
      })
      it('should save a reference to the name', function(done){
        appRecord.length.should.equal(1);
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
    })
    it('should stop an app by name');
    it('should stop all apps');
    it('should be able to uninstall an app')
  });

  describe('Functional', function(){
    it('should be able to init a sensor');

    // Matrix.init(['temperature', 'monitor'])
    it('should be able to init multiple sensors');

    // Matrix.init(['temperature', 'monitor'], { refresh: 10000 });
    it('should share one option with multiple sensors');

    // Matrix.init(['temperature', 'monitor'], {
    //   temperature: { refresh: 30000 },
    //   monitor: { refresh: 1000 }
    // })
    it('should send keyed options to multiple sensors');

    //temperature.between(72,95)
    it('should be able to filter data');
    it('should be able to apply computer vision');
    it('should return filtered data in .then()');
  });

  describe('Inter-App Messaging', function(){
    it('should be able to recieve a targeted message');
    it('should be able to recieve a global message')
  });
})
