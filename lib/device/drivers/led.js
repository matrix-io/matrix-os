var builder, matrixMalosBuilder, component;

var loaderInt;

function stopLoader() {
  debug('Loader stopped');
  if (loaderInt) clearInterval(loaderInt);
}

function clear() {
  var config = new matrixMalosBuilder.DriverConfig;
  config.image = new matrixMalosBuilder.EverloopImage;

  for (var i = 0; i < 35; i++) {
    var led = new matrixMalosBuilder.LedValue;
    led.setRed(0);
    led.setGreen(0);
    led.setBlue(0);
    led.setWhite(0);
    config.image.led.push(led);
  }

  component.print(config.encode().toBuffer());
}

module.exports = {
  // runs init automatically. setup component here for loader
  init: function() {
    builder = Matrix.service.protobuf.malos.driver;
    matrixMalosBuilder = builder.build('matrix_malos');

    var options = { name: 'led' };

    var mqs = Matrix.service.zeromq.registerComponent(Matrix.device.drivers[options.name]);

    // put connections in options for component
    _.extend(options, mqs);

    // this is the init for the LED
    component = new Matrix.service.component(options);
  },

  send: function(colors) {
    Matrix.device.drivers.led.prepare(colors, function(colorProto) {
      component.print(colorProto);
    })
  },

  prepare: function(colors, cb) {
    var config = new matrixMalosBuilder.DriverConfig;
    config.image = new matrixMalosBuilder.EverloopImage;

    for (var i = 0; i < 35; i++) {
      var led = new matrixMalosBuilder.LedValue;
      if (i < colors.length) {
        var c = colors[i];
        if (!_.has(c, 'w')) {
          c.w = 0;
        }
        led.setRed(c.r);
        led.setGreen(c.g);
        led.setBlue(c.b);
        led.setWhite(c.w);
      } else {
        // blanks
        led.setRed(0);
        led.setGreen(0);
        led.setBlue(0);
        led.setWhite(0);
      }
      config.image.led.push(led);
    }

    cb(config.encode().toBuffer());
  },
  sendProto: function(colorsProto) {
    component.print(colorsProto.encode().toBuffer());
  },
  clear: clear,
  bleLoader: function() {
    stopLoader();
    clear();
    //Blue fast breathing effect
    const dimFactor = 6; //This is static 1 - 255
    var counter = 0;
    var ledArray;
    var intensity; //This changes over time
    var config = new matrixMalosBuilder.DriverConfig;
    config.image = new matrixMalosBuilder.EverloopImage;

    loaderInt = setInterval(function() {
      intensity = Math.abs(Math.sin(counter));

      ledArray = [];
      for (var i = 0; i < 35; i++) {
        var led = new matrixMalosBuilder.LedValue;
        var color = Math.floor((255 * intensity) / dimFactor);
        led.setBlue(color);
        ledArray.push(led);
      }
      config.image.led = ledArray;
      component.print(config.encode().toBuffer());
      counter += 1 / 20;
    }, 25);
  },
  bleConnection: function() {
    stopLoader();
    clear();
    //Cyan fast breathing effect
    const dimFactor = 6; //This is static 1 - 255
    var counter = 0;
    var ledArray;
    var intensity; //This changes over time
    var config = new matrixMalosBuilder.DriverConfig;
    config.image = new matrixMalosBuilder.EverloopImage;

    loaderInt = setInterval(function() {
      intensity = Math.abs(Math.sin(counter));

      ledArray = [];
      for (var i = 0; i < 35; i++) {
        var led = new matrixMalosBuilder.LedValue;
        var color = Math.floor((255 * intensity) / dimFactor);
        led.setGreen(color);
        ledArray.push(led);
      }
      config.image.led = ledArray;
      component.print(config.encode().toBuffer());
      counter += 1 / 10;
    }, 50);
  },
  loader: function() {
    stopLoader();
    clear();
    var int = 0;
    var l = 5;

    loaderInt = setInterval(function() {
      var config = new matrixMalosBuilder.DriverConfig;
      config.image = new matrixMalosBuilder.EverloopImage;

      var dimFactor = 0;
      for (var i = 0; i < 35; i++) {
        var led = new matrixMalosBuilder.LedValue;

        led.setRed(0);
        led.setGreen(0);
        led.setBlue(0);
        led.setWhite(0);

        if (int === i) {
          led.setRed(255 - i * 6);
          led.setGreen(64 + i * 6);
          led.setBlue(i * 6);
        } else if (i > int && i <= int + l && dimFactor < 1) {
          led.setRed(Math.round((255 - i * 6) * dimFactor));
          led.setGreen(Math.round((64 + i * 6) * dimFactor));
          led.setBlue(Math.round((i * 6) * dimFactor));
          dimFactor += 0.2;
        }

        config.image.led.push(led);
      }
      l = (int % 3 === 0) ? l - 1 : l;
      l = (int % 17 === 0) ? 5 : l;
      int = (int < 35) ? int + 1 : 0;

      component.print(config.encode().toBuffer());
    }, 10)
  },
  throbber: function() {

    var fadeIn = true;
    var bright = 1;

    loaderInt = setInterval(function() {
      var config = new matrixMalosBuilder.DriverConfig;
      config.image = new matrixMalosBuilder.EverloopImage;

      bright = (fadeIn) ? bright + 1 : bright - 1;

      fadeIn = (bright >= 75 || bright <= 1) ? !fadeIn : fadeIn;

      for (var i = 0; i < 35; i++) {
        var led = new matrixMalosBuilder.LedValue;

        led.setRed(0);
        led.setGreen(0);
        led.setBlue(bright);
        led.setWhite(0);


        config.image.led.push(led);
      }

      component.print(config.encode().toBuffer());
    }, 10)
  },
  loader2: function() {

    // Boom constructor
    var Boom = function() {
      var self = this;
      this.start = Math.floor(Math.random() * 35);
      this.baseColor = [
        Math.round(Math.random() * 255),
        Math.round(Math.random() * 255),
        Math.round(Math.random() * 255)
      ];

      this.strength = Math.round(Math.random() * 100);
      this.speed = 1.25 || Math.round(Math.random() * 5);
      this.particles = 10 || Math.round(Math.random() * 10);

      this.particleWeight = _.map(Array(10), function() { return Math.random() * 100 });



      this.t = function(tick) {
        var config = new matrixMalosBuilder.DriverConfig;
        config.image = new matrixMalosBuilder.EverloopImage;
        self.spread = [];

        for (var i = 0; i < this.particles; i++) {
          var direction = (Math.random() > 0.5) ? 1 : -1;
          var targetIndex = self.start + (self.speed * tick * direction / self.particleWeight[i]);
          targetIndex = (targetIndex > 35) ? targetIndex - 35 : targetIndex;
          targetIndex = (targetIndex < 0) ? targetIndex + 35 : targetIndex;
          self.spread.push(Math.round(targetIndex));
        }

        var p = 0;

        // figure out light matrix
        for (var i = 0; i < 35; i++) {
          var led = new matrixMalosBuilder.LedValue;
          led.setRed(0);
          led.setGreen(0);
          led.setBlue(0);
          led.setWhite(0);

          if (self.start === i) {
            led.setRed(Math.round(self.baseColor[0] / tick))
            led.setGreen(Math.round(self.baseColor[1] / tick))
            led.setBlue(Math.round(self.baseColor[2] / tick))
          }

          if (self.spread.indexOf(i) !== -1) {
            led.setRed(Math.round((self.baseColor[0]) * self.strength / tick / self.particleWeight[p]))
            led.setGreen(Math.round((self.baseColor[1]) * self.strength / tick / self.particleWeight[p]))
            led.setBlue(Math.round((self.baseColor[2]) * self.strength / tick / self.particleWeight[p]))
            p++;
          }

          config.image.led.push(led);
        }
        //
        // console.log(config.image, this)

        component.print(config.encode().toBuffer());
      }

      // end boom
    }

    var b = new Boom();
    var b1 = new Boom();
    var b2 = new Boom();
    var tick = 1;

    loaderInt = setInterval(function() {
      b.t(tick++);
      // if ( tick > 20 ){
      //   b1.t(tick - 20);
      // }
      // if ( tick > 40 ){
      //   b2.t(tick - 40);
      // }
    }, 20)

  },
  loader3: function() {
    stopLoader();
    clear();
    var colors = [
      { r: 236, g: 255, b: 0 },
      { r: 193, g: 255, b: 0 },
      { r: 145, g: 255, b: 0 },
      { r: 86, g: 255, b: 0 },
      { r: 40, g: 255, b: 0 },
      { r: 2, g: 255, b: 0 },
      { r: 0, g: 255, b: 28 },
      { r: 0, g: 255, b: 67 },
      { r: 0, g: 255, b: 120 },
      { r: 0, g: 255, b: 167 },
      { r: 0, g: 255, b: 214 },
      { r: 0, g: 255, b: 247 },
      { r: 0, g: 239, b: 255 },
      { r: 0, g: 192, b: 255 },
      { r: 0, g: 138, b: 255 },
      { r: 0, g: 82, b: 255 },
      { r: 0, g: 36, b: 255 },
      { r: 0, g: 1, b: 255 },
      { r: 27, g: 0, b: 255 },
      { r: 70, g: 0, b: 255 },
      { r: 112, g: 0, b: 255 },
      { r: 161, g: 0, b: 255 },
      { r: 204, g: 0, b: 255 },
      { r: 240, g: 0, b: 255 },
      { r: 240, g: 0, b: 255 },
      { r: 255, g: 0, b: 189 },
      { r: 255, g: 0, b: 143 },
      { r: 255, g: 0, b: 79 },
      { r: 255, g: 0, b: 18 },
      { r: 255, g: 7, b: 0 },
      { r: 255, g: 43, b: 0 },
      { r: 255, g: 92, b: 0 },
      { r: 255, g: 149, b: 0 },
      { r: 255, g: 203, b: 0 },
      { r: 255, g: 247, b: 0 }
    ];

    var colorFill = []; //Second array to slowly fill iris with color
    var counter = 0;
    const dimFactor = 10; //1 - 255, use 1 for full blinding powah

    var config = new matrixMalosBuilder.DriverConfig;
    config.image = new matrixMalosBuilder.EverloopImage;

    //Set base black color array
    for (var i = 0; i < 35; i++) {
      var led = new matrixMalosBuilder.LedValue;
      led.setRed(0);
      led.setGreen(0);
      led.setBlue(0);
      led.setWhite(0);
      colorFill[i] = led;
    }

    loaderInt = setInterval(function() {
      if (counter < 35) { //Transfer colors over
        var led = new matrixMalosBuilder.LedValue;
        led.setRed(Math.floor(colors[counter].r / dimFactor));
        led.setGreen(Math.floor(colors[counter].g / dimFactor));
        led.setBlue(Math.floor(colors[counter].b / dimFactor));
        colorFill[counter] = led;
        counter++;
      } else { //Shift array for rotation effect
        colorFill.unshift(colorFill[34]);
        colorFill.pop();
      }
      config.image.led = colorFill;
      component.print(config.encode().toBuffer()); //Render
    }, 15);

  },
  stopLoader: stopLoader,
  error: function() {

    var config = new matrixMalosBuilder.DriverConfig;
    config.image = new matrixMalosBuilder.EverloopImage;

    for (var i = 0; i < 35; i++) {
      var led = new matrixMalosBuilder.LedValue;

      led.setRed(127);
      led.setGreen(0);
      led.setBlue(0);
      led.setWhite(0);

      config.image.led.push(led);
    }

    component.send(config.encode().toBuffer());
  },
  ping: function() {
    var intensity = 1;
    var up = true;

    var o = 0;


    var int = setInterval(function() {
      var config = new matrixMalosBuilder.DriverConfig;
      config.image = new matrixMalosBuilder.EverloopImage;
      for (var i = 0; i < 35; i++) {
        var led = new matrixMalosBuilder.LedValue;
        led.setRed(Math.round(intensity / 4));
        led.setGreen(Math.round(intensity / 3));
        led.setBlue(intensity);
        led.setWhite(0);

        config.image.led.push(led);
      }

      if (intensity > 25) {
        up = false;
        o = 1;
      }


      o += 0.25;

      intensity = (up) ? Math.floor(intensity + o) : Math.floor(intensity - o);

      debug(intensity);


      component.print(config.encode().toBuffer());

      if (up === false && intensity <= 1) {
        clearInterval(int)
        process.nextTick(function() {
          Matrix.device.drivers.led.clear();
        })
      }
    }, 25)

  }

}