var debug = debugLog('token');
var fs = require('fs');

module.exports = {
  get: function(cb) {
    // check local db
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
        debug("[DB]->(token) : ", token);
        var decryptedToken = Matrix.service.cypher.decrypt(token.token);
        Matrix.token = decryptedToken;
        Matrix.userId = token.userId
        debug("[DB]->(token)(decrypt): ", decryptedToken);
        cb(null, decryptedToken);
      }
    });
  },
  set: function(token, cb) {
    debug('(token)', token)
    Matrix.userId = token.userId;
    Matrix.token = token.userToken;

    Matrix.db.service.remove({
      token: {
        $exists: true
      }
    }, {
      multi: true
    }, function(err, count) {
      if (err) return cb(err);
      debug("(token)->[DB] ", token);
      var encryptedToken = Matrix.service.cypher.encrypt(token.userToken);
      debug("(token)->[DB](encrypt) ", encryptedToken);
      var decryptedToken = Matrix.service.cypher.decrypt(encryptedToken);
      debug("(token)->[DB](decrypt) ", decryptedToken);

      Matrix.db.service.insert({
        // clientToken: token.clientToken,
        token: encryptedToken,
        userId: token.userId
      }, cb);
    });
  }
}
