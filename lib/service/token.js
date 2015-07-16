var fs = require('fs');

module.exports = {
  get: function(cb) {
    Matrix.db.findOne({
      token: {
        $exists: true
      }
    }, cb);
  },
  set: function(token, cb) {
    Matrix.db.remove({
      token: {
        $exists: true
      }
    }, {
      multi: true
    }, function(err, count) {
      if (err) return cb(err);
      Matrix.db.insert({
        token: token
      }, cb);
    });
  }
}
