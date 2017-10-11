var zeromq = require('zeromq');
var protobuf = require('protobufjs');
describe('component', function () {
  var component, TestProto, malosSend, malosRead, malosPing, malosError, TestProto;

  before(function () {

    var TestBuilder = protobuf.loadProtoFile('./test/fixtures/test.proto');
    TestProto = TestBuilder.build('matrix_test');
    //fake device
    Matrix.device.port.defaults.test = 11370;

    // fake driver
    Matrix.device.drivers.test = {
      name: 'test',
      init: function () { },
      read: function (buffer) {
        return new TestProto.Test.decode(buffer)
      },
      prepare: function (option, cb) {
        var t = new TestProto.Test;
        _.extend(t, option)
        cb(TestProto.Test.encode(t).finish());
      },
      ping: function () {
        Matrix.components.test.ping();
      },
      config: function (config) {
        Matrix.components.test.config(config)
      },
      error: function (err) {
        return err.toString();
      }
    }

    // makes component available
    var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers.test);

    component = new Matrix.service.component(mqs);

    //fake malos
    malosSend = zeromq.socket('pull');
    malosError = zeromq.socket('pub');
    malosRead = zeromq.socket('pub');
    malosPing = zeromq.socket('pull');

    malosSend.bindSync('tcp://127.0.0.1:' + Matrix.device.port.get('test').send);
    malosPing.bindSync('tcp://127.0.0.1:' + Matrix.device.port.get('test').ping);

  })

  describe('Component', function () {
    it('should register component on Matrix.components', function () {
      Matrix.components.should.have.property('test')
    });

    it('should identify as a sensor', function () {
      Matrix.components.test.sensor.should.equal(true);
    })

    describe('Component methods', function () {
      it('should have a send method', function () {
        Matrix.components.test.should.have.property('send')
      })
      it('should have a read method', function () {
        Matrix.components.test.should.have.property('read')
      })
      it('should have a ping method', function () {
        Matrix.components.test.should.have.property('ping')
      })
      it('should have a error method', function () {
        Matrix.components.test.should.have.property('error')
      })
      it('should have a config method', function () {
        Matrix.components.test.should.have.property('config')
      })
    })

    describe('functional', function () {

      it('should implement ping', function (done) {
        var d = _.once(done);
        malosPing.on('message', function (msg) {
          d();
        })
        Matrix.components.test.ping();
      });

      it('should implement send', function (done) {
        var d = _.once(done);
        malosSend.on('message', function (msg) {
          var decode = new TestProto.Test.decode(msg);
          decode.should.property('test', true);
          d();
        })

        Matrix.components.test.send({ test: true });
      });

      it('should implement print', function (done) {
        malosSend.connect('tcp://127.0.0.1:' + Matrix.device.port.get('test').input);
        var d = _.once(done);

        malosSend.on('message', function (msg) {
          var decode = new TestProto.Test.decode(msg);
          decode.should.property('test', true);
          d();
        })

        //print takes raw protobufs
        var t = new TestProto.Test;
        t.test = true;
        Matrix.components.test.print(TestProto.Test.encode(t).finish());
      })

      it('should implement read', function (done) {
        Matrix.components.test.read(function (msg) {
          msg.should.property('test', true);
          done();
        });

        malosRead.bindSync('tcp://127.0.0.1:' + Matrix.device.port.get('test').read);
        //print takes raw protobufs
        var t = new TestProto.Test;
        t.test = true;
        setTimeout(function () {
          malosRead.send(TestProto.Test.encode(t).finish());
        }, 500)
      })

      // TODO: Finish this, not sure why not working
      it('should implement error', function (done) {
        Matrix.components.test.error(function (msg) {
          msg.should.equal('test');
          done();
        });


        malosError.bindSync('tcp://127.0.0.1:' + Matrix.device.port.get('test').error);
        // var malosSub = zeromq.socket('sub')
        // malosSub.connect('tcp://127.0.0.1:' + Matrix.device.port.get('test').error);
        // malosSub.subscribe('');
        // malosSub.on('message', function(d){
        //   console.log('TEST DATA', d.toString());
        // })
        setTimeout(function () {
          malosError.send('test');
        }, 500)

      })
    });

  })
})
