

describe('Matrix Applications', function(){
  describe('Lifecycle', function(){
    it('should be able to install an app')
    it('should be able to update an app')
    it('should start an app by name');
    describe('activeApplications', function(){
      it('should save a reference to the process')
      it('should save a reference to the name')
      it('should save a reference to the configuration')
      it('should save a reference to the sensors')
    })
    it('should stop an app by name');
    it('should stop all apps');
    it('should be able to uninstall an app')
  });

  describe('Functional', function(){
    it('should be able to init a sensor');

    // Matrix.init(['temperature', 'monitor'])
    it('should be able to init multiple sensors');

    // Matrix.init(['temperature', 'monitor'], { refresh: 10000 });
    it('should share one option with multiple sensors');

    // Matrix.init(['temperature', 'monitor'], {
    //   temperature: { refresh: 30000 },
    //   monitor: { refresh: 1000 }
    // })
    it('should send keyed options to multiple sensors');

    //temperature.between(72,95)
    it('should be able to filter data');
    it('should be able to apply computer vision');
    it('should return filtered data in .then()');
  });

  describe('Inter-App Messaging', function(){
    it('should be able to recieve a targeted message');
    it('should be able to recieve a global message')
  });

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
})
