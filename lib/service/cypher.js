var debug = debugLog('cypher');
var crypto = require('crypto'),
  settings = {
    algorithm: 'aes-256-ctr',
    passphrase: process.env.PASSPHRASE || 'Swordfish!',
    prefix: '_$CM'
  }
    
    
    
module.exports = {
  encrypt: function (text){
    debug("(CYPHER) encryption pass: " + settings.passphrase+Matrix.deviceId);
    var cipher = crypto.createCipher(settings.algorithm,settings.passphrase+Matrix.deviceId)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return settings.prefix+crypted;
  },
  decrypt: function (text){
    var result = text;
    debug("(CYPHER) decryption pass: " , settings.passphrase+Matrix.deviceId);
    if(!text || text.length < settings.prefix.length || text.substring(0, settings.prefix.length) != settings.prefix){
      debug("(CYPHER) Prefix " + settings.prefix + " wasn't found, skipping decryption");
    } else {
      text = text.substring(settings.prefix.length);
      var decipher = crypto.createDecipher(settings.algorithm,settings.passphrase+Matrix.deviceId)
      var dec = decipher.update(text,'hex','utf8');
      dec += decipher.final('utf8');
      result = dec;
    }
    return result;
  },
  settings: settings
}
