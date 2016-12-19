
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

    // this is the init for the LED
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
        if ( !_.has(c, 'w')){
          c.w = 0;
        }
        led.setRed( c.r );
        led.setGreen( c.g );
        led.setBlue( c.b );
        led.setWhite( c.w );
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
    var l = 5;

    loaderInt = setInterval(function () {
      var config = new matrixMalosBuilder.DriverConfig;
      config.image = new matrixMalosBuilder.EverloopImage;

      var dimFactor = 0;
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

        else if ( i > int && i <= int+l && dimFactor < 1){
          led.setRed( Math.round((255 - i * 6) * dimFactor) );
          led.setGreen( Math.round((64 + i * 6)  * dimFactor));
          led.setBlue(Math.round(( i * 6 )  * dimFactor));
          dimFactor += 0.2;
        }

        config.image.led.push( led );
      }
      l = ( int % 3 === 0 ) ? l - 1 : l;
      l = ( int % 17 === 0 ) ? 5 : l;
      int = ( int < 35 ) ? int + 1 : 0;

      component.print( config.encode().toBuffer() );
    }, 10 )
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

    component.send( config.encode().toBuffer() );
  },
  ping: function(){
    var intensity = 1;
    var up = true;

    var o = 0;


    var int = setInterval(function(){
      var config = new matrixMalosBuilder.DriverConfig;
      config.image = new matrixMalosBuilder.EverloopImage;
      for ( var i = 0; i < 35; i++){
        var led = new matrixMalosBuilder.LedValue;
        led.setRed( Math.round(intensity / 4)  );
        led.setGreen( Math.round(intensity/ 3) );
        led.setBlue( intensity );
        led.setWhite( 0 );

        config.image.led.push( led );
      }

      if ( intensity > 25 ){
        up = false;
        o = 1;
      }


      o += 0.25;

      intensity = ( up ) ? Math.floor(intensity+o) : Math.floor(intensity-o);

      debug(intensity);


      component.print( config.encode().toBuffer() );

      if ( up === false && intensity <= 1 ){
        clearInterval(int)
        process.nextTick( function () {
          Matrix.device.drivers.led.clear();
        })
      }
    }, 25 )

  }

}
