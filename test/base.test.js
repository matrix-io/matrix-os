describe('Matrix Base', function() {
  describe('Environment Variables', function() {
    it('should have MATRIX_API_SERVER', function(done) {
      _.isUndefined(Matrix.apiServer).should.be.false;
      done();
    });
    it('should have MATRIX_STREAMING_SERVER', function(done) {
      _.isUndefined(Matrix.streamingServer).should.be.false;
      done();
    });
    it('should have MATRIX_CLIENT_ID', function(done) {
      _.isUndefined(Matrix.clientId).should.be.false;
      done();
    });
    it('should have MATRIX_CLIENT_SECRET', function(done) {
      _.isUndefined(Matrix.clientSecret).should.be.false;
      done();
    });
    it('should have MATRIX_DEVICE_ID', function(done) {
      _.isUndefined(Matrix.deviceId).should.be.false;
      done();
    });
    it('should have MATRIX_DEVICE_NAME', function(done) {
      _.isUndefined(Matrix.deviceName).should.be.false;
      done();
    });
    it('should have MATRIX_USER', function(done) {
      _.isUndefined(Matrix.user).should.be.false;
      done();
    });
    it('should have MATRIX_PASSWORD', function(done) {
      _.isUndefined(Matrix.password).should.be.false;
      done();
    });
  });

	describe('Event System', function(){
		this.timeout(15000);
		it('should attach app event listeners', function(done){
			Matrix.events.listeners('app-emit').should.have.lengthOf(1);
			Matrix.events.listeners('app-config').should.have.lengthOf(1);
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
});
