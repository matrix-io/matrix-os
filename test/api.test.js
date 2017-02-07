describe('App API', function(){
  this.timeout(5000)


  describe('matrix lib', function(){

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
      it.skip('audio',function(){
        matrix.should.have.ownProperty('audio')
      })
      it.skip('mic',function(){
        matrix.should.have.ownProperty('mic')
      })
      it.skip('gpio',function(){
        matrix.should.have.ownProperty('gpio')
      })
    })
  })

  describe('init', function(){
    describe('services', function(){

      it('face', function (done){
        testAppAPI('face', function(msg){
          assert.equal(msg.type, 'service-init')
          assert.equal(msg.name, 'face')
          done();
        })
      })
      it('demographics', function (done){
        testAppAPI('demographics', function(msg){
          assert.equal(msg.type, 'service-init')
          assert.equal(msg.name, 'demographics')
          done();
        })
      })
      it('vehicle', function (done){
        testAppAPI('vehicle', function(msg){
          assert.equal(msg.type, 'service-init')
          assert.equal(msg.name, 'vehicle')
          done();
        })
      })
      it('palm', function (done){
        testAppAPI('palm', function(msg){
          assert.equal(msg.type, 'service-init')
          assert.equal(msg.name, 'palm')
          done();
        })
      })
      it('pinch', function (done){
        testAppAPI('pinch', function(msg){
          assert.equal(msg.type, 'service-init')
          assert.equal(msg.name, 'pinch')
          done();
        })
      })
      it('fist', function (done){
        testAppAPI('fist', function(msg){
          assert.equal(msg.type, 'service-init')
          assert.equal(msg.name, 'fist')
          done();
        })
      })
      it('thumb-up', function (done){
        testAppAPI('thumb-up', function(msg){
          console.log(msg);
          assert.equal(msg.type, 'service-init')
          assert.equal(msg.name, 'thumb-up')
          done();
        })
      })
    })


    describe('sensors', function (){
      it('temperature', function(done){
        testAppAPI('temperature', function(msg){
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'temperature')
          done();
        })
      })
      it('altitude', function(done){
        testAppAPI('altitude', function(msg){
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'altitude')
          done();
        })
      })
      it('humidity', function(done){
        testAppAPI('humidity', function(msg){
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'humidity')
          done();
        })
      })
      it('gyroscope', function(done){
        testAppAPI('gyroscope', function(msg){
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'gyroscope')
          done();
        })
      })
      it('accellerometer', function(done){
        testAppAPI('accellerometer', function(msg){
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'accellerometer')
          done();
        })
      })
      it('nfc', function(done){
        testAppAPI('nfc', function(msg){
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'nfc')
          done();
        })
      })
      it('pressure', function(done){
        testAppAPI('pressure', function(msg){
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'pressure')
          done();
        })
      })
      it('uv', function(done){
        testAppAPI('uv', function(msg){
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'uv')
          done();
        })
      })
      it('mic', function(done){
        testAppAPI('mic', function(msg){
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'mic')
          done();
        })
      })
      it('ir', function(done){
        testAppAPI('ir', function(msg){
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'ir')
          done();
        })
      })
    })
  })


  describe('services', function(){
    this.timeout(10000);

    it.skip('crosstalk', function (done) {
      testAppAPI('talk', function(r){
        if (r.payload === 'foo'){
          assert.equal( r.type, 'app-message');
        } else if (r.payload ==='otherfoo') {
          assert.equal(r.type, 'app-otherapp-message');
        } else if (r.payload === 'namedfoo'){
          assert.equal(r.event, 'nameofevent');
          done();
        }
      })
    })
    it('matrix.led.render', function (done){
      testAppAPI('led', function(resp){
        assert.equal(resp.type, 'led-image');
        done();
      });
    });
    it.only('matrix.type.send', function (done) {
      testAppAPI('send', function(r){
        console.log('send', r)
        assert.equal(r.type, 'app-emit');
        assert.equal(r.payload.foo, 1);
        assert.equal(r.payload.type, 'test');
        assert( r.payload.hasOwnProperty('time') );
        done();
      })
    })
  })
})
