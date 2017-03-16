describe.skip('Encryption', function() {
  var testMessage = "Hello World";
  var currentDeviceId = Matrix.deviceId;
  var cypher = Matrix.service.cypher;
  var encryptedTestMessage;

  it('should be able to encrypt a string', function(done) {
    var result = cypher.encrypt(testMessage);
    encryptedTestMessage = result;
    if (result !== testMessage) {
      done();
    } else {
      done("Message is not encrypted");
    }
  });
  it('should be able to decrypt a string', function(done) {
    var result = cypher.decrypt(encryptedTestMessage);
    if (result === testMessage) {
      done();
    } else {
      done("Unable to decrypt sample message");
    }
  });
  it('should add a prefix to encrypted strings', function(done) {
    var result = cypher.encrypt(testMessage);
    if (result.substring(0, cypher.settings.prefix.length) === cypher.settings.prefix) {
      done();
    } else {
      done("Encrypted message doesn't contain the prefix in it");
    }
  });
  it('should not decrypt unencrypted messages', function(done) {
    var result = cypher.decrypt(testMessage);
    console.log(result, testMessage)
    if (result === testMessage) {
      done();
    } else {
      done("Decrypted message doesn't match the original message");
    }
  });
  after(function() {
    Matrix.deviceId = currentDeviceId;
  });
});