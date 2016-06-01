var debug = debugLog('token');
var jwt = require('jsonwebtoken')

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
        Matrix.service.auth.authenticate(token, function(err, auth){
          if(err) return cb(err);
          auth.token = Matrix.service.cypher.decrypt(auth.token);
          Matrix.service.token.set(auth, cb);
        });
      } else {
        debug("[DB]->(token) : ", token);
        token.token = Matrix.service.cypher.decrypt(token.token);


        _.extend(Matrix, token);
        debug("[DB]->(token)(decrypt): ", token.token);
        cb(null, token.token);
      }
    });
  },
  set: function(token, cb) {
    debug('(token)', token)

    // Set Matrix.deviceSecret Matrix.userId
    //     Matrix.token Matrix.deviceToken
    _.extend(Matrix, token);

    Matrix.db.service.remove({
      token: {
        $exists: true
      }
    }, {
      multi: true
    }, function(err, count) {
      if (err) return cb(err);
      debug("(token)->[DB] ", token);
      var encryptedToken = Matrix.service.cypher.encrypt(token.token);
      debug("(token)->[DB](encrypt) ", encryptedToken);
      var decryptedToken = Matrix.service.cypher.decrypt(encryptedToken);
      debug("(token)->[DB](decrypt) ", decryptedToken);

      Matrix.db.service.insert({
        deviceToken: token.deviceToken,
        deviceSecret: token.deviceSecret,
        token: encryptedToken,
        userId: token.userId
      }, function(err, token){
        if ( _.isFunction(cb)){
          cb(null, decryptedToken)
        }
      });
    });
  },
  clear: function(cb){
    Matrix.db.service.remove({
      token: {
        $exists: true
      }
    }, {
      multi: true
    }, cb);
  }
}
