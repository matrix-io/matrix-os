var tc = require('tinycolor2');

/*
Usage: led( c ).render() -> Writes to STRIP. just LED will not work
See: https://matrix-io.github.io/matrix-documentation/API/everloop/
 */

module.exports = function(c) {
  //default
  var colors = c;

  if (_.isPlainObject(c)) {
    // apply just this one
    colors[0] = c;
  }

  // fill
  if (_.isString(c)) {
    colors = _.times(35, _.constant(c));
  }

  // init an empty array
  var colorLayers = [];

  // colors array prepared
  _.each(colors, function(color, i) {
    // console.log('start>>>', color, i)
    var tcColors = _.times('#000000', 35);

    if (_.isPlainObject(color)) {
      // console.log('o>', color)
      // shape
      if (_.has(color, 'spin')) {
        color.color = tc(color.color).spin(color.spin);
      }

      if (_.has(color, 'fade')) {
        var steps = color.fade || 10;
        var stepPer = 100 / steps;
        var start = color.start || 0;
        for (var i = 0; i < steps; i++) {
          var targetIndex = start - i;
          if (targetIndex < 0) {
            targetIndex = 35 + targetIndex;
          }
          tcColors[targetIndex] = tc(color.color).darken(stepPer * i);
        }
      }

      if (_.has(color, 'arc')) {
        //if not defined, off
        color.color = color.color || 'black';
        start = color.start || 0;

        // draw arc degrees to lights 360 / 10 = 36
        // => [ 'black', 'black', 'black', ]
        // TODO: project degrees properly onto 35 lights
        var arcArray = _.times(Math.abs(Math.round(35 * (color.arc / 360))), function() { return color.color });
        _.each(arcArray, function(ac, i2) {
          var bump = (color.arc > 0) ? i2 : -i2
          var targetIndex = Math.round(35 * (color.start / 360)) + bump;
          if (targetIndex < 0) {
            targetIndex = 35 + targetIndex;
          }
          // splice values into tcColor array
          tcColors[targetIndex] = ac;
          color.endIndex = targetIndex;
        })



        if (color.blend === true) {
          // 245 = 24.5 - 24 = 0.5
          // draw next cell
          var blendAmt = (color.arc / 10) - Math.floor(color.arc / 10);
          if (blendAmt > 0) {
            tcColors[color.endIndex + 1] = tc(color.color).darken((1 - blendAmt) * 25);
          }
        }

      } else if (_.has(color, 'angle')) {
        // draw angle
        // 24.75


        if (color.angle < 0) {
          // spin it right round again, like a record
          color.angle = 360 + color.angle;
        }
        color.angle = (color.angle < 360) ? color.angle : color.angle % 360;

        // 24.75
        var point = 35 * (color.angle / 360)

        if (color.blend === true) {
          //which light?
          // 24
          var base = Math.trunc(point);
          // .75
          var sub1Weight = point - base;
          // .25
          var sub2Weight = 1 - sub1Weight;

          // 28 is where one light comes on when the other disappears
          // 25 has two lights on all the time, 30 has a period with one light on
          var darkWeight = 28;

          tcColors[base] = tc(color.color).darken(sub1Weight * darkWeight);
          tcColors[base + 1] = tc(color.color).darken(sub2Weight * darkWeight);

        } else {
          // default blend false
          var angleIndex = Math.round(point);
          tcColors[angleIndex] = color.color;
        }
      }
      // is not an object
    } else {
      // console.log('>', color);
      if (_.isNumber(color)) {
        color = '#' + _.repeat(6, color.toString(16));
      }
      tcColors[i] = color;
    }

    // console.log(tcColors);
    // make every color a tc color
    tcColors = _.map(tcColors, function(c) {
      return tc(c);
    });

    //wrap end to beginning
    var tcLayers = _.chunk(tcColors, 35)

    // console.log(printLights(tcColors));

    // push wrapping layers to compose matrix
    _.each(tcLayers, function(t) {
      colorLayers.push(t);
    });

    // console.log('end', tcColors[0], tcColors.length, colorLayers.length);
  })

  // composeLayers(colorLayers);

  // setTCColors(tcColors);

  var subFn = {
    // change this into objects to process during composition vs inline
    brighten: function(bi) {
      _.each(colorLayers, function(c, i) {
        colorLayers[i] = c.brighten(bi);
      })
      return subFn;
    },

    darken: function(di) {
      _.each(colorLayers, function(c, i) {
        _.each(c, function(co, i2) {
          colorLayers[i][i2] = co.darken(di);
        })
      })
      return subFn;
    },

    rotate: function(deg) {
      deg = deg % 360;
      // OOO is important
      var lights = Math.round(deg / (360 / 35));
      for (var i = 0; i <= lights; i++) {
        _.each(colorLayers, function(a) {
          a.unshift(tc('#000000'));
        });
      }
      return subFn;
    },
    render: function() {
      composeLayers(colorLayers);
    }
  }

  return subFn;
}

// COLORS will be TC colors
function setTCColors(colors) {
  var tcColors = [];
  _.each(colors, function(c) {
    tcColors.push(tc(c));
  })

  emitColorRing(tcColors);
}


function composeLayers(layers) {

  // uncomment to debug layering
  // console.log('== compStart vv');
  var i = 0;
  var final = _.reduce(layers, function(r, v) {

    // console.log( i++, printLights(v));
    // combine matrix of points with next layer
    _.each(v, function(c, i) {
      composeMix = true;
      if (composeMix === true) {
        if (c.isValid()) {
          if (c.getBrightness() > 0) {
            r[i % 35] = tc.mix(r[i % 35], c, 50);
          }
        }
      } else {
        if (c.isValid()) {
          // straight replace
          // for shape shifting, write final value
          r[i % 35] = c;
        }

      }
    });

    return r;
  }, [])

  // console.log('=---= compDone');
  // console.log('C :'.grey, printLights(final));
  emitColorRing(final);
}

//TC Colors to CMD
function emitColorRing(colors) {
  // console.log('EMIT>>>>', colors, colors.length)
  // printColors(colors);
  colors = _.map(colors, function(c) {
    if (_.isUndefined(c)) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    var rgb = c.toRgb();

    // luminence conversion for accuracy behind tinted glass
    // 0.299*R + 0.587*G + 0.114
    if (process.env.SUN_MODE === 'true') {
      var luma = [0.299, 0.587, 0.114];
      rgb.w = Math.round(luma[0] * rgb.r + luma[1] * rgb.g + luma[2] * rgb.b);
    }

    // make sure light goes on if it's on
    rgb.r = (rgb.r > 0) ? Math.max(16, rgb.r) : rgb.r;
    rgb.g = (rgb.g > 0) ? Math.max(16, rgb.g) : rgb.g;
    rgb.b = (rgb.b > 0) ? Math.max(16, rgb.b) : rgb.b;

    return rgb;
  })

  // colors should be { r: g: b: }
  process.send({
    type: 'led-image',
    payload: colors
  });

}


function printColors(tcColors) {
  console.log(_.repeat(30, '='), 'CLOCK')
  _.each(tcColors, function(c) {
    console.log(c.getOriginalInput());
  })
}

function printLights(tcColors) {
  return _.reduce(tcColors, function(r, c) {
    if (_.isUndefined(c) || c.getBrightness() === 0) {
      return r + ' '
    } else if (c.isLight()) {
      return r + ':';
    } else {
      return r + '.'.grey;
    }
  }, '');
}