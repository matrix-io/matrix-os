
var builder, matrixMalosBuilder, component;

var loaderInt;

module.exports = {
  // runs init automatically. setup component here for loader
  init: function(){
    builder = Matrix.service.protobuf.malos.driver;
    matrixMalosBuilder = builder.build( 'matrix_malos' );

    var options = { name: 'led' };

    var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers[options.name]);

    // put connections in options for component
    _.extend(options, mqs);

    component = new Matrix.service.component(options);
  },

send: function(colors){
  Matrix.device.drivers.led.prepare(colors, function(colorProto){
    component.print(colorProto);
  })
},

prepare: function(colors, cb){
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

  cb( config.encode().toBuffer() );
},
sendProto: function(colorsProto){
  component.print( colorsProto.encode().toBuffer() );
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
  }

  component.print( config.encode().toBuffer() );
},
loader: function(){

  var int = 0;
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

    component.print( config.encode().toBuffer() );
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
    component.send( config.encode().toBuffer() );
  }

}
