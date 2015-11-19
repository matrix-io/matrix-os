describe('Matrix Applications', function(){
  describe('Lifecycle', function(){
    it('should be able to install an app')
    it('should be able to update an app')
    it('should start an app by name');
    it('should save active apps in activeApplications')
    it('should stop an app by name');
    it('should stop all apps');
    it('should be able to uninstall an app')
  });

  describe('Functional', function(){
    it('should be able to init a sensor');
    it('should be able to filter data');
    it('should be able to apply computer vision');
    it('should return filtered data in .then()');
  });

  describe('Inter-App Messaging', function(){
    it('should be able to recieve a targeted message');
    it('should be able to recieve a global message')
  });
})
