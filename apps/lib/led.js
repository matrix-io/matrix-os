var tc = require('tinycolor2');

/*
Usage: led( c ).render() -> Writes to STRIP. just LED will not work
See: https://matrix-io.github.io/matrix-documentation/API/everloop/
 */

module.exports = function(c) {

  process.send({
    type: 'led-color',
    payload: c
  });
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

        if (_.has(color, 'rotate')) {
          deg = deg % 360;
          // OOO is important
          var lights = Math.round(deg / (360 / 35));
          for (var i = 0; i <= lights; i++) {
            _.each(tcColors, function(a, j) {
              if (tcColors.length > 35) {
                //wrap around
                a.unshift(tcColors[35 + j]);
              } else {
                a.unshift(tc('#000000'));

              }
            });
          }
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
      process.send({
        type: 'led-render',
        payload: colors
      });
    }
  }

  return subFn;
}