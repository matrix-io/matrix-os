
describe.skip('component', function(){
  var component, TestProto;
  before(function(){
    component = new Matrix.service.component({})

    var tProto = protobuf.loadProtoFile('./fixtures/test.proto')
    var tBuilder = tProto.build('matrix_test');
    var ProtoTest = tBuilder.Test;


    //fake device
    Matrix.device.port.test = 13370;


    Matrix.device.drivers.test = {
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

      }

      // makes component available
      Matrix.service.zeromq.registerComponent(Matrix.device.drivers.test);
    }

  })

  describe('Component basics', function () {
    it('should register component on Matrix.components', function () {
      (Matrix.components).should.have.key('test')
    });

    describe('Component methods', function(){
      it('should have a send method', function(){
        (Matrix.components).should.have.key('send')
      })
      it('should have a read method', function(){
        (Matrix.components).should.have.key('read')
      })
      it('should have a ping method', function(){
        (Matrix.components).should.have.key('ping')
      })
      it('should have a error method', function(){
        (Matrix.components).should.have.key('error')
      })
      it('should have a config method', function(){
        (Matrix.components).should.have.key('config')
      })
    })

  })

  it('should implement ping', function(done){
    component.ping();
    zmqChannel.see(function(data){
      done();
    })
  });
  it('should implement prepare', function(done){
    component.prepare(function(proto){
      (typeof proto).should.be.eql('buffer');
      done();
    });
  });
  it('should implement send', function(done){
    component.send({ test: true });
    zmqChannel.see(function(data){
      done();
    })
  })
  it('should implement print', function(done){
    TestProto
    component.print( )
  })
  it('should implement read')
  it('should implement error')
  it('should apply sensor = true to drivers with a read component')
  it('should register a new component in Matrix.components')
})
