
var protobuf = require('protobufjs');
var zmq = require('zermq')


describe.skip('component', function(){
  var component, TestProto;
  before(function(){
    component = new Matrix.component()

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
      }

    }

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
    component.print( )
  })
  it('should implement read')
  it('should implement error')
  it('should apply sensor = true to drivers with a read component')
  it('should register a new component in Matrix.components')
})
