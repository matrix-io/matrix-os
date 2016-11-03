var zeromq = require('zmq');

describe.only('component', function(){
  var component, TestProto;
  before(function(){

    //fake device
    Matrix.device.port.defaults.test = 11370;

    // fake driver
    Matrix.device.drivers.test = {
      name: 'test',
      init: function(){},
      read: function(buffer){
        return new TestProto.Test.decode(buffer)
      },
      prepare: function(option, cb){
        var t = new tBuilder.Test;
        for ( var k in option ){
          t[k] = option[k];
        }
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
    var config = zeromq.socket('pull');
    var error = zeromq.socket('pub');
    var update = zeromq.socket('pub');
    var ping = zeromq.socket('pull');

    config.connect('tcp://127.0.0.1:' + Matrix.device.port.get('test').input);
    error.connect('tcp://127.0.0.1:' + Matrix.device.port.get('test').error);
    update.connect('tcp://127.0.0.1:' + Matrix.device.port.get('test').update);
    ping.connect('tcp://127.0.0.1:' + Matrix.device.port.get('test').ping);



  })

  describe('Component basics', function () {
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

  })

  it('should implement ping');
  it('should implement prepare');
  it('should implement send')
  it('should implement print')
  it('should implement read')
  it('should implement error')
  it('should apply sensor = true to drivers with a read component')
  it('should register a new component in Matrix.components')
})
