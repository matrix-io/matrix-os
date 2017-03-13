describe.only('App API', function() {
  this.timeout(10000)


  describe('matrix lib method structure', function() {

    before(function() {
      matrix = require(__dirname + '/../apps/matrix.js');
    })

    describe('base matrix methods', function() {
      it('sensor()', function() {
        matrix.should.have.ownProperty('sensor')
      });
      it('service()', function() {
        matrix.should.have.ownProperty('service')
      });
      it('type()', function() {
        matrix.should.have.ownProperty('type')
      })
      it('send()', function() {
        matrix.should.have.ownProperty('send')
      })
      it('static()', function() {
        matrix.should.have.ownProperty('static')
      })
      it('emit()', function() {
        matrix.should.have.ownProperty('emit')
      })
      it('on()', function() {
        matrix.should.have.ownProperty('on')
      })
    })

    describe('matrix modules structure ok', function() {
      it('led', function() {
        matrix.should.have.ownProperty('led')
      })
      it.skip('audio', function() {
        matrix.should.have.ownProperty('audio')
      })
      it.skip('mic', function() {
        matrix.should.have.ownProperty('mic')
      })
      it.skip('gpio', function() {
        matrix.should.have.ownProperty('gpio')
      })
    })
  
  })

  describe('matrix.service', function() {
      describe('recognition service-cmd generation', function(done) {
        it('start', function(done) {
          testAppAPI(
            'recog-start',
            function(msg) {
              console.log(msg);
              assert.equal(msg.type, 'service-cmd')
              assert.equal(msg.cmd, 'start')
              assert.equal(msg.serviceType, 'face')
              done();
            });
        });
        it('stop', function(done) {
          testAppAPI(
            'recog-stop',
            function(msg) {
              assert.equal(msg.type, 'service-cmd')
              assert.equal(msg.cmd, 'stop')
              assert.equal(msg.serviceType, 'face')
              done();
            });
        });
        it('train', function(done) {
          testAppAPI(
            'recog-train',
            function(msg) {
              assert.equal(msg.type, 'service-cmd')
              assert.equal(msg.cmd, 'train')
              assert.equal(msg.serviceType, 'face')
              done();
            });
        });
        it('untrain', function(done) {
          testAppAPI(
            'recog-untrain',
            function(msg) {
              assert.equal(msg.type, 'service-cmd')
              assert.equal(msg.cmd, 'delete')
              assert.equal(msg.serviceType, 'face')
              done();
            });
        });
      });

      it('face', function(done) {
        testAppAPI('face', function(msg) {
          assert.equal(msg.type, 'service-cmd')
          assert.equal(msg.serviceType, 'face')
          assert.equal(msg.engine, 'detection')
          done();
        })
      })
      it('demographics', function(done) {
        testAppAPI('demographics', function(msg) {
          console.log(msg);
          assert.equal(msg.type, 'service-cmd')
          assert.equal(msg.serviceType, 'demographics')
          assert.equal(msg.engine, 'recognition')
          done();
        })
      })
      it.skip('vehicle', function(done) {
        testAppAPI('vehicle', function(msg) {
          console.log(msg)
          assert.equal(msg.type, 'service-cmd')
          assert.equal(msg.serviceType, 'vehicle')
          assert.equal(msg.engine, 'detection')
          done();
        })
      })
      it('palm', function(done) {
        testAppAPI('palm', function(msg) {
          assert.equal(msg.type, 'service-cmd')
          assert.equal(msg.serviceType, 'palm')
          assert.equal(msg.engine, 'detection')
          done();
        })
      })
      it('pinch', function(done) {
        testAppAPI('pinch', function(msg) {
          assert.equal(msg.type, 'service-cmd')
          assert.equal(msg.serviceType, 'pinch')
          assert.equal(msg.engine, 'detection')
          done();
        })
      })
      it('fist', function(done) {
        testAppAPI('fist', function(msg) {
          assert.equal(msg.type, 'service-cmd')
          assert.equal(msg.serviceType, 'fist')
          assert.equal(msg.engine, 'detection')
          done();
        })
      })
      it('thumb-up', function(done) {
        testAppAPI('thumb-up', function(msg) {
          console.log(msg);
          assert.equal(msg.type, 'service-cmd')
          assert.equal(msg.serviceType, 'thumb-up')
          assert.equal(msg.engine, 'detection')
          done();
        })
      })
    })


    describe('sensors', function() {
      it('temperature', function(done) {
        testAppAPI('temperature', function(msg) {
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'temperature')
          done();
        })
      })
      it('altitude', function(done) {
        testAppAPI('altitude', function(msg) {
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'altitude')
          done();
        })
      })
      it('humidity', function(done) {
        testAppAPI('humidity', function(msg) {
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'humidity')
          done();
        })
      })
      it('gyroscope', function(done) {
        testAppAPI('gyroscope', function(msg) {
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'gyroscope')
          done();
        })
      })
      it('accellerometer', function(done) {
        testAppAPI('accellerometer', function(msg) {
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'accellerometer')
          done();
        })
      })
      it('nfc', function(done) {
        testAppAPI('nfc', function(msg) {
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'nfc')
          done();
        })
      })
      it('pressure', function(done) {
        testAppAPI('pressure', function(msg) {
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'pressure')
          done();
        })
      })
      it('uv', function(done) {
        testAppAPI('uv', function(msg) {
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'uv')
          done();
        })
      })

      it('ir', function(done) {
        testAppAPI('ir', function(msg) {
          assert.equal(msg.type, 'sensor-init')
          assert.equal(msg.name, 'ir')
          done();
        })
      })
    })
  })


  describe('services', function() {
    this.timeout(10000);

    it.skip('crosstalk', function(done) {
      testAppAPI('talk', function(r) {
        if (r.payload === 'foo') {
          assert.equal(r.type, 'app-message');
        } else if (r.payload === 'otherfoo') {
          assert.equal(r.type, 'app-otherapp-message');
        } else if (r.payload === 'namedfoo') {
          assert.equal(r.event, 'nameofevent');
          done();
        }
      })
    })
    it('matrix.led.render', function(done) {
      testAppAPI('led', function(resp) {
        assert.equal(resp.type, 'led-image');
        done();
      });
    });
    it('matrix.type.send', function(done) {
      testAppAPI('send', function(r) {
        assert.equal(r.type, 'app-emit');
        assert.equal(r.payload.foo, 1);
        assert.equal(r.payload.type, 'test');
        assert(r.payload.hasOwnProperty('time'));
        done();
      })
    })
})