
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
  loader2:function(){

    // Boom constructor
    var Boom = function(){
      var self = this;
      this.start = Math.floor(Math.random()*35);
      this.baseColor = [
        Math.round(Math.random()*255),
        Math.round(Math.random()*255),
        Math.round(Math.random()*255)
      ];

      this.strength = Math.round(Math.random()*100);
      this.speed = 1.25 || Math.round(Math.random()*5);
      this.particles = 10 || Math.round(Math.random()*10);

      this.particleWeight = _.map(Array(10), function(){ return Math.random()*100 });



      this.t = function(tick){
        var config = new matrixMalosBuilder.DriverConfig;
        config.image = new matrixMalosBuilder.EverloopImage;
          self.spread = [];

          for ( var i=0; i< this.particles; i++){
            var direction = (Math.random() > 0.5) ? 1: -1;
            var targetIndex =  self.start + ( self.speed * tick * direction / self.particleWeight[i] );
            targetIndex = ( targetIndex > 35 ) ? targetIndex - 35 : targetIndex;
            targetIndex = ( targetIndex < 0 ) ? targetIndex + 35 : targetIndex;
            self.spread.push(Math.round(targetIndex));
          }

          var p = 0;

          // figure out light matrix
          for ( var i = 0; i < 35; i++){
            var led = new matrixMalosBuilder.LedValue;
            led.setRed( 0 );
            led.setGreen( 0 );
            led.setBlue( 0 );
            led.setWhite( 0 );

            if (self.start === i){
              led.setRed( Math.round(  self.baseColor[0] / tick ))
              led.setGreen( Math.round(  self.baseColor[1] / tick ))
              led.setBlue( Math.round(  self.baseColor[2] / tick ))
            }

            if ( self.spread.indexOf(i) !== -1 ){
              led.setRed( Math.round( ( self.baseColor[0] ) * self.strength / tick / self.particleWeight[p] ))
              led.setGreen( Math.round( ( self.baseColor[1] ) * self.strength / tick / self.particleWeight[p] ))
              led.setBlue( Math.round( ( self.baseColor[2] ) * self.strength / tick / self.particleWeight[p] ))
              p++;
            }

            config.image.led.push(led);
          }
          //
          // console.log(config.image, this)

          component.print( config.encode().toBuffer() );
        }

    // end boom
    }

    var b = new Boom();
    var b1 = new Boom();
    var b2 = new Boom();
    var tick = 1;

    loaderInt = setInterval(function () {
      b.t(tick++);
      // if ( tick > 20 ){
      //   b1.t(tick - 20);
      // }
      // if ( tick > 40 ){
      //   b2.t(tick - 40);
      // }
    }, 20)

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
