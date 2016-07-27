log('hihi')
describe('other services', function(){
  // clear saved state info
  before(function (done) {
    Matrix.db.service.remove({}, {multi:true}, done);
  })
  describe('token', function () {
    before('should get a token', function (done) {
      Matrix.service.get(function(err, token){
        if (err) console.error(err);
        token.should.be.ok();
        done();
      })
    })
    it('should save matrix token', function(done){
      Matrix.db.service.findOne({
        token: {
          $exists: true
        }
      }, function(err, token){
        if (err) console.error(err);
        token.should.be.ok();
        done();
      });
    });
    it('should set Matrix.token', function(done){
      Matrix.token.should.be.ok();
    })
  })
})
