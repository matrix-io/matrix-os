describe('Matrix App API', function () {
  var matrix;
  before(function(){
    matrix = require(__dirname + '/../apps/matrix.js');
  })
  describe('base matrix methods', function () {
    it('init()', function(){
      matrix.should.have.ownProperty('init')
    });
    it('type()', function(){
      matrix.should.have.ownProperty('type')
    })
    it('send()',function(){
      matrix.should.have.ownProperty('send')
    })
    it('static()',function(){
      matrix.should.have.ownProperty('static')
    })
    it('emit()',function(){
      matrix.should.have.ownProperty('emit')
    })
    it('on()',function(){
      matrix.should.have.ownProperty('on')
    })
  })

  describe('matrix modules', function(){
    it('led',function(){
      matrix.should.have.ownProperty('led')
    })
    it('audio',function(){
      matrix.should.have.ownProperty('audio')
    })
    it('mic',function(){
      matrix.should.have.ownProperty('mic')
    })
  })

  // run a matrix app
  describe('functional app outputs',function () {
    var appEmit = [];
    var appEvent = [];
    var exec = require('child_process').execSync;
    before(function(done){
      exec('cp -r ./test/fixtures/test.matrix/ ./apps/test.matrix')
      Matrix.events.on('app-emit', function(d){
        // console.log('OUTOUTOUT', d);
        appEmit.push(d);
      })
      Matrix.events.on('app-message', function(d){
        // console.log('EVENT', d);
        appEvent.push(d);
      })
      Matrix.events.on('app-otherapp-message', function(d){
        // console.log('EVENT', d);
        appEvent.push(d);
      })
      Matrix.events.on('app-log', function(d){
        if(d.indexOf('Finish') > -1 ){
          done();
        }
      })
      Matrix.service.manager.start('test');

    })

    after(function(){
      exec('rm -r ./apps/test.matrix')
    })

    it('can send a typed message', function(){
      appEmit[0].payload.should.have.properties({
        foo: 1,
        type: 'testType',
        appName: 'test'
      });
    })
    it('can send an app typed message', function(){
      appEmit[1].payload.should.have.properties({
        foo: 2,
        type: 'test',
        appName: 'test'
      });
    })
    it('can send a global event', function(){
      appEvent[0].payload.should.equal('foo')
    })
    it('can send a app specific event', function(){
      appEvent[1].payload.should.equal('otherfoo')

    })
    it('can send a namespaced app specific event', function(){
      appEvent[2].event.should.equal('nameofevent')
      appEvent[2].payload.should.equal('namedfoo')
    })

  })

  describe('init()', function () {
    it('will start a temperature sensor')
    it('will start a humidity sensor')
    it('will start a face detection')
    it('will start a crowd detection')
    it('will start a face recognition')
    it('will start a vehicle count')
  })
});
