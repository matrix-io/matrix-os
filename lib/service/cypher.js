var debug = debugLog('cypher');
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'Swordfish!',
    prefix = '_$CM';
    
    
module.exports = {
  encrypt: function (text){
    debug("(CYPHER) encryption pass: " + password+Matrix.deviceId);
    var cipher = crypto.createCipher(algorithm,password+Matrix.deviceId)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return prefix+crypted;
  },
  decrypt: function (text){
    var result = text;
    debug("(CYPHER) decryption pass: " , password+Matrix.deviceId);
    if(!text || text.length < prefix.length || text.substring(0, prefix.length) != prefix){
      debug("(CYPHER) Prefix " + prefix + " wasn't found, skipping decryption");
    } else {
      text = text.substring(prefix.length);
      console.log("Using:" + password+Matrix.deviceId);
      var decipher = crypto.createDecipher(algorithm,password+Matrix.deviceId)
      var dec = decipher.update(text,'hex','utf8');
      dec += decipher.final('utf8');
      result = dec;
    }
    return result;
  }
}
