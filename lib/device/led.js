
var builder, matrixHalBuilder;

module.exports = {
  init: function(){
    builder = Matrix.service.protobuf.hal;
    matrixHalBuilder = builder.build( "matrix_hal" );
  },
  update: function(colors){

    var image = new matrixHalBuilder.EverloopImage;

    _.each( colors, function ( c ) {
      var led = new matrixHalBuilder.LedValue;

      led.setRed( c.r );
      led.setGreen( c.g );
      led.setBlue( c.b );
      led.setWhite( 0 );
      image.led.push( led );
    });

    Matrix.service.zeromq.led( image.encode().toBuffer() );
  },
  clear: function(){
    var image = new matrixHalBuilder.EverloopImage;

    for ( var i = 0; i < 35; i++){
      var led = new matrixHalBuilder.LedValue;

      led.setRed( 0 );
      led.setGreen( 0 );
      led.setBlue( 0 );
      led.setWhite( 0 );
      image.led.push( led );
    }

    Matrix.service.zeromq.led( image.encode().toBuffer() );
  }
}
