
var builder, matrixHalBuilder;

var loaderInt;

module.exports = {
  init: function(){
    builder = Matrix.service.protobuf.malos.hal;
    matrixHalBuilder = builder.build( "matrix_hal" );
  },
  update: function(colors){

    var image = new matrixHalBuilder.EverloopImage;
    for ( var i = 0; i < 35; i++){
      var led = new matrixHalBuilder.LedValue;
      if ( i < colors.length ){
        var c = colors[i];
        led.setRed( c.r );
        led.setGreen( c.g );
        led.setBlue( c.b );
        led.setWhite( 0 );
      } else {
        led.setRed( 0 );
        led.setGreen( 0 );
        led.setBlue( 0 );
        led.setWhite( 0 );
      }
      image.led.push( led );
    }

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
  },
  loader: function(){
    var int = 0;
    loaderInt = setInterval(function () {
      var image = new matrixHalBuilder.EverloopImage;

      for ( var i = 0; i < 35; i++){
        var led = new matrixHalBuilder.LedValue;

        led.setRed( 0 );
        led.setGreen( 0 );
        led.setBlue( 0 );
        led.setWhite( 0 );

        if ( int === i ) {
          led.setRed( 255 - i * 6 );
          led.setGreen( 64 + i * 6 );
          led.setBlue( i * 6 );
        }


        image.led.push( led );
      }

      int = ( int < 35 ) ? int + 1 : 0;
      Matrix.service.zeromq.led( image.encode().toBuffer() );
    }, 100 )
  },
  stopLoader: function(){
    clearInterval(loaderInt)
  }
}
