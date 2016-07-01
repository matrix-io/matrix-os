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


});
