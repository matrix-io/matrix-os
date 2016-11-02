
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


  })

  describe('Component basics', function () {
    it('should register component on Matrix.components', function () {
      Matrix.components.should.have.key('test')
    });

    describe('Component methods', function(){
      it('should have a send method', function(){
        Matrix.components.test.should.have.key('send')
      })
      it('should have a read method', function(){
        Matrix.components.test.should.have.key('read')
      })
      it('should have a ping method', function(){
        Matrix.components.test.should.have.key('ping')
      })
      it('should have a error method', function(){
        Matrix.components.test.should.have.key('error')
      })
      it('should have a config method', function(){
        Matrix.components.test.should.have.key('config')
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
