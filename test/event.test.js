describe('Event System', function(){
  this.timeout(15000);
  it('should attach app event listeners', function(done){
    Matrix.events.listeners('app-emit').should.have.lengthOf(1);
    Matrix.events.listeners('app-log').should.have.lengthOf(1);
    done();
  });
  it('should attach sensor event listeners', function(done){
    Matrix.events.listeners('sensor-emit').should.have.lengthOf(1);
    Matrix.events.listeners('sensor-init').should.have.lengthOf(1);
    Matrix.events.listeners('sensor-close').should.have.lengthOf(1);
    done();
  });
  it('should attach server event listeners', function(done){
    Matrix.events.listeners('cli-message').should.have.lengthOf(1);
    done();
  });
  it('should attach token event listeners', function(done){
    Matrix.events.listeners('token-refresh').should.have.lengthOf(1);
    done();
  });
  it('should attach util event listeners', function(done){
    Matrix.events.listeners('device-reboot').should.have.lengthOf(1);
    done();
  });
});
