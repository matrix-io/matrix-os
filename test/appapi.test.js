describe('Matrix App API', function () {
  describe('base matrix methods', function () {
    it('init()')
    it('type()')
    it('send()')
    it('base()')
    it('emit()')
    it('on()')
  })

  describe('matrix modules', function(){
    it('led')
    it('audio')
    it('mic')
  })

  // run a matrix app
  describe('functional app outputs',function () {
    var appOutput;
    var exec = require('child_process').execSync;
    before(function(){
      exec('cp -r ./test/fixtures/test.matrix ./apps/test.matrix')
      appOutput = require('child_process').fork('node ./apps/test.matrix/index.js')
      console.log(appOutput);
    })
    after(function(){
      exec('rm -r ./apps/test.matrix')
    })

    it('can send a typed message', function(done){

    })
    it('can send an app typed message', function(done){

    })
    it('can send a global event', function(done){

    })
    it('can send a app specific event', function(done){

    })
    it('can send a namespaced app specific event', function(done){

    })

  })
});
