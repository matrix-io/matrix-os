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
        debug("(TOKEN) Token as stored in DB: ", token);
        var decryptedToken = Matrix.service.cypher.decrypt(token.deviceToken);
        token.deviceToken = decryptedToken; 
        debug("(TOKEN) Token from DB decrypted: ", decryptedToken); 
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
      debug("(TOKEN) Token to store: ", token.deviceToken);
      var encryptedToken = Matrix.service.cypher.encrypt(token.deviceToken);
      debug("(TOKEN) Encrypted token: ", encryptedToken);
      var decryptedToken = Matrix.service.cypher.decrypt(encryptedToken);
      debug("(TOKEN) Decrypted token (just for show): ", decryptedToken);
      
      Matrix.db.service.insert({
        // clientToken: token.clientToken,
        deviceToken: encryptedToken
      }, cb);
    });
  }
}
