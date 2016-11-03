var zeromq = require('zmq');
var protobuf = require('protobufjs');
describe.only('component', function(){
  var component, TestProto, send, read, ping, config, TestProto;
  before(function(){

    var TestBuilder = protobuf.loadProtoFile('./test/fixtures/test.proto');
    TestProto = TestBuilder.build('matrix_test');
    //fake device
    Matrix.device.port.defaults.test = 11370;

    // fake driver
    Matrix.device.drivers.test = {
      name: 'test',
      init: function(){},
      read: function(buffer){
        return new Test.decode(buffer)
      },
      prepare: function(option, cb){
        var t = new TestProto.Test;
        _.extend(t, option)
        cb( t.encode().toBuffer() )
      },
      ping: function(){
        Matrix.components.test.ping();
      },
      config: function(config){
        Matrix.components.test.config(config)
      },
      error: function(cb){
        Matrix.components.test.error(cb)
      }
    }

    // makes component available
    var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers.test);

    component = new Matrix.service.component( mqs );

    //fake malos
    send = zeromq.socket('pull');
    error = zeromq.socket('pub');
    update = zeromq.socket('pub');
    ping = zeromq.socket('pull');

    send.connect('tcp://127.0.0.1:' + Matrix.device.port.get('test').input);
    error.connect('tcp://127.0.0.1:' + Matrix.device.port.get('test').error);
    update.connect('tcp://127.0.0.1:' + Matrix.device.port.get('test').update);
    ping.connect('tcp://127.0.0.1:' + Matrix.device.port.get('test').ping);


  })

  describe('Component', function () {
    it('should register component on Matrix.components', function () {
      Matrix.components.should.have.property('test')
    });

    it('should identify as a sensor', function(){
      Matrix.components.test.sensor.should.equal(true);
    })

    describe('Component methods', function(){
      it('should have a send method', function(){
        Matrix.components.test.should.have.property('send')
      })
      it('should have a read method', function(){
        Matrix.components.test.should.have.property('read')
      })
      it('should have a ping method', function(){
        Matrix.components.test.should.have.property('ping')
      })
      it('should have a error method', function(){
        Matrix.components.test.should.have.property('error')
      })
      it('should have a config method', function(){
        Matrix.components.test.should.have.property('config')
      })
    })

    describe('functional', function () {

      it('should implement ping', function (done) {
        ping.on('message', function (msg){
          done();
        })
        Matrix.components.test.ping();
      });

      it('should implement send', function(done){
        send.on('message', function (msg){
          var decode = new TestProto.Test.decode(msg);
          decode.should.property('test', true );
          done();
        })
        Matrix.components.test.send({ test: true });
      });
    });
  })
  it('should implement send')
  it('should implement print')
  it('should implement read')
  it('should implement error')
  it('should apply sensor = true to drivers with a read component')
  it('should register a new component in Matrix.components')
})
