
  describe('Encryption', function(){
    var testMessage = "Hello World";
    var encryptedMessageSansPrefix = "de58abe329032212f7055e";
    var currentDeviceId = Matrix.deviceId;
    var cypher = require("../lib/service/cypher.js");
    var encryptedTestMessage = cypher.settings.prefix+encryptedMessageSansPrefix;
    before(function(){
      Matrix.deviceId = "ab:cd:ed:gh:ij:kl";
      cypher.settings.passphrase = "MyPass";
    });
    it('should be able to encrypt a string', function(done) {
      var result = cypher.encrypt(testMessage);
      if(result === encryptedTestMessage){
        done();
      } else {
        done("Encrypted message matches sample");
      }
    });
    it('should be able to decrypt a string', function(done){
      var result = cypher.decrypt(encryptedTestMessage);
      if(result === testMessage){
        done();
      } else {
        done("Unable to decrypt sample message");
      }
    });
    it('should add a prefix to encrypted strings', function(done){
      var result = cypher.encrypt(testMessage);
      if(result.substring(0, cypher.settings.prefix.length) === cypher.settings.prefix){
        if(result.substring(cypher.settings.prefix.length) === encryptedMessageSansPrefix){
          done();
        } else {
          done("Encrypted message prefix isn't placed correctly");
        }
      } else {
        done("Encrypted message doesn't contain the prefix in it");
      }
    });
    it('should not decrypt unencrypted messages', function(done){
      var result = cypher.decrypt(testMessage);
      if(result === testMessage){
        done();
      } else {
        done("Decrypted message doesn't match the original message");
      }
    });
    after(function(){
      Matrix.deviceId = currentDeviceId;
    });
  });
