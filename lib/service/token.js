var fs = require('fs');

module.exports = {
  get: function(cb) {
    Matrix.db.service.findOne({
      token: {
        $exists: true
      }
    }, function(err, token){
      if (err) return cb(err);
      if (_.isNull(token)){
        log('no token. at all.'.red, null)
        Matrix.service.auth.authenticate(token, cb);
      } else {
        cb(null, token);
      }
    });
  },
  set: function(token, cb) {
    Matrix.token = token;
    Matrix.db.service.remove({
      token: {
        $exists: true
      }
    }, {
      multi: true
    }, function(err, count) {
      if (err) return cb(err);
      Matrix.db.service.insert({
        token: token,
        username: Matrix.user
      }, cb);
    });
  }
}
