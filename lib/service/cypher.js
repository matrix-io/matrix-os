var debug = debugLog('cypher');
var crypto = require('crypto'),
  settings = {
    algorithm: 'aes-256-ctr',
    prefix: '_$CM'
  }

const ivLength = 16;
const keyLength = 32;

module.exports = {
  encrypt: function (text, prefix) {
    if (_.isUndefined(prefix)) prefix = settings.prefix;

    var key = Matrix.deviceSecret.substring(0, keyLength);
    //This works as long as the deviceId.length < ivLength (12 < 16)
    var iv = _.repeat(Matrix.deviceId, (ivLength / Matrix.deviceId.length) + 1).substring(0, ivLength);

    debug("encryption pass: " + key);
    debug("In", text)
    var cipher = crypto.createCipheriv(settings.algorithm, key, iv);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return prefix+crypted;
  },
  decrypt: function (text, prefix) {
    if (_.isUndefined(prefix)) prefix = settings.prefix;

    var key = Matrix.deviceSecret.substring(0, keyLength);
    //This works as long as the deviceId.length < ivLength (12 < 16)
    var iv = _.repeat(Matrix.deviceId, (ivLength / Matrix.deviceId.length) + 1).substring(0, ivLength);
    var result = text;
    debug("(CYPHER) decryption pass: ", key);
    if (!text || (prefix !== '' && ( (text.length < prefix.length) || (text.substring(0, prefix.length) != prefix)))) {
      debug("(CYPHER) Prefix " + prefix + " wasn't found, skipping decryption");
    } else {
      text = text.substring(prefix.length);
      var decipher = crypto.createDecipheriv(settings.algorithm, key, iv);
      var dec = decipher.update(text,'hex','utf8');
      dec += decipher.final('utf8');
      result = dec;
    }
    return result;
  },
  settings: settings
}
