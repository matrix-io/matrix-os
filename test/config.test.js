// describe('Configuration via Firebase', function(){
//
//   var app;
//
//   before(function(){
//     require('child_process').execSync('cp -r '+ __dirname + '/test.matrix/ '+ __dirname +'/../apps/test.matrix/');
//     app = new Matrix.service.application.Application('test');
//   })
//
//   after(function(){
//     require('child_process').execSync('rm -r '+__dirname+'/../apps/test.matrix');
//   })
//
//   //app.getConfigFromFile(cb)
//   it('can populate from file', function(done){
//     app.getConfigFromFile();
//     app.config.test.should.equal(true);
//     done();
//   })
//   it('should save an application configuration to firebase', function(done){
//     app.syncConfig(app.config);
//     app.config = {};
//     done();
//   });
//
//   it('can populate from firebase', function(done){
//     app.getConfig(function(err, resp){
//       app.config.test.should.equal(true);
//       done();
//     });
//   })
//   it('should provide a configuration to an application');
//   it('should update a configuration based on local config.yaml');
//   it('should emit a `config-update` when config is updated');
//   it('should restart an application when the active configuration is changed');
//   // it('should assign an application to a device in the configuration');
// })
