
var builder, matrixMalosBuilder;

var loaderInt;

module.exports = {
  init: function(){
    builder = Matrix.service.protobuf.malos.driver;
    matrixMalosBuilder = builder.build( "matrix_malos" );
  },

  /*

  var config = new matrixMalosBuilder.DriverConfig
  config.image = new matrixMalosBuilder.EverloopImage
  for (var j = 0; j < 35; ++j) {
  var ledValue = new matrixMalosBuilder.LedValue;
  ledValue.setRed(0);
  ledValue.setGreen(0);
  ledValue.setBlue(0);
  ledValue.setWhite(0);
  config.image.led.push(ledValue)
}
configSocket.send(config.encode().toBuffer());

*/
update: function(colors){
  var config = new matrixMalosBuilder.DriverConfig;
  config.image = new matrixMalosBuilder.EverloopImage;

  for ( var i = 0; i < 35; i++){
    var led = new matrixMalosBuilder.LedValue;
    if ( i < colors.length ){
      var c = colors[i];
      led.setRed( c.r );
      led.setGreen( c.g );
      led.setBlue( c.b );
      led.setWhite( 0 );
    } else {
      // blanks
      led.setRed( 0 );
      led.setGreen( 0 );
      led.setBlue( 0 );
      led.setWhite( 0 );
    }
    config.image.led.push( led );
  }

  Matrix.service.zeromq.led( config.encode().toBuffer() );
},
clear: function(){
  var config = new matrixMalosBuilder.DriverConfig;
  config.image = new matrixMalosBuilder.EverloopImage;

  for ( var i = 0; i < 35; i++){
    var led = new matrixMalosBuilder.LedValue;
    led.setRed( 0 );
    led.setGreen( 0 );
    led.setBlue( 0 );
    led.setWhite( 0 );
    config.image.led.push( led );

    Matrix.service.zeromq.led( config.encode().toBuffer() );

  }
},
loader: function(){

  var int = 0;
  var range = 0;
  loaderInt = setInterval(function () {
    var config = new matrixMalosBuilder.DriverConfig;
    config.image = new matrixMalosBuilder.EverloopImage;

    for ( var i = 0; i < 35; i++){
      var led = new matrixMalosBuilder.LedValue;

      led.setRed( 0 );
      led.setGreen( 0 );
      led.setBlue( 0 );
      led.setWhite( 0 );

      if ( int === i ) {
        led.setRed( 255 - i * 6 );
        led.setGreen( 64 + i * 6 );
        led.setBlue( i * 6 );
      }

      config.image.led.push( led );
    }
    int = ( int < 35 ) ? int + 1 : 0;
    Matrix.service.zeromq.led( config.encode().toBuffer() );

  }, 25 )
},
stopLoader: function(){
  clearInterval(loaderInt)
},
error: function(){

    var config = new matrixMalosBuilder.DriverConfig;
    config.image = new matrixMalosBuilder.EverloopImage;

    for ( var i = 0; i < 35; i++){
      var led = new matrixMalosBuilder.LedValue;

      led.setRed( 127 );
      led.setGreen( 0 );
      led.setBlue( 0 );
      led.setWhite( 0 );



      config.image.led.push( led );
    }
    int = ( int < 35 ) ? int + 1 : 0;
    Matrix.service.zeromq.led( config.encode().toBuffer() );
  }

}
