var fs = require('fs');

module.exports = {
  get: function(cb) {
    Matrix.db.service.findOne({
      token: {
        $exists: true
      }
    }, cb);
  },
  set: function(token, cb) {
    Matrix.events.emit('token-refresh', token);
    Matrix.db.service.remove({
      token: {
        $exists: true
      }
    }, {
      multi: true
    }, function(err, count) {
      if (err) return cb(err);
      Matrix.db.service.insert({
        token: token
      }, cb);
    });
  }
}
