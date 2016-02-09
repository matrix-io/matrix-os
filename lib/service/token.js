var debug = debugLog('token');
var fs = require('fs');

module.exports = {
  get: function(cb) {
    Matrix.db.service.findOne({
      deviceToken: {
        $exists: true
      }
    }, function(err, token){
      if (err) return cb(err);
      if (_.isNull(token)){
        log('no token. at all.'.red, null)
        Matrix.service.auth.authenticate(token, cb);
      } else {
        debug("[DB]->(token) : ", token);
        var decryptedToken = Matrix.service.cypher.decrypt(token.deviceToken);
        token.deviceToken = decryptedToken;
        debug("[DB]->(token)(decrypt): ", decryptedToken);
        cb(null, token);
      }
    });
  },
  set: function(token, cb) {
    // Matrix.token = token.clientToken;
    // Matrix.clientToken = Matrix.token;
    Matrix.deviceToken = token.deviceToken;
    Matrix.db.service.remove({
      deviceToken: {
        $exists: true
      }
    }, {
      multi: true
    }, function(err, count) {
      if (err) return cb(err);
      debug("(token)->[DB] ", token.deviceToken);
      var encryptedToken = Matrix.service.cypher.encrypt(token.deviceToken);
      debug("(token)->[DB](encrypt) ", encryptedToken);
      var decryptedToken = Matrix.service.cypher.decrypt(encryptedToken);
      debug("(token)->[DB](decrypt) ", decryptedToken);

      Matrix.db.service.insert({
        // clientToken: token.clientToken,
        deviceToken: encryptedToken
      }, cb);
    });
  }
}
