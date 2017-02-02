var debug = debugLog('cypher');
var crypto = require('crypto'),
  settings = {
    algorithm: 'aes-256-ctr',
    passphrase: process.env.PASSPHRASE || 'Swordfish!',
    prefix: '_$CM'
  }



module.exports = {
  encrypt: function (text, prefix) {
    if (_.isUndefined(prefix)) prefix = settings.prefix;
    var key = Matrix.deviceSecret.substring(0, 10);
    debug("encryption pass: " + key);
    debug("In", text)
    var cipher = crypto.createCipher(settings.algorithm, key);    
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return prefix+crypted;
  },
  decrypt: function (text, prefix) {
    if (_.isUndefined(prefix)) prefix = settings.prefix;
    var key = Matrix.deviceSecret.substring(0, 10); 
    var result = text;
    debug("(CYPHER) decryption pass: ", key);
    if (!text || (prefix !== '' && ( (text.length < prefix.length) || (text.substring(0, prefix.length) != prefix)))) {
      debug("(CYPHER) Prefix " + prefix + " wasn't found, skipping decryption");
    } else {
      text = text.substring(prefix.length);
      var decipher = crypto.createDecipher(settings.algorithm, key)
      var dec = decipher.update(text,'hex','utf8');
      dec += decipher.final('utf8');
      result = dec;
    }
    return result;
  },
  settings: settings
}
