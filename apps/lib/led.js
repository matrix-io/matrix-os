var tc = require('tinycolor2');

module.exports = function ( c ) {

  //default
  var colors = c;

  if ( _.isPlainObject( c ) ) {
    // apply just this one
    colors[ 0 ] = c;
  }

  // fill
  if ( _.isString( c ) ) {
    colors = _.times( 35, c );
  }

  // interleave
  if ( _.isString( c[ 0 ] ) && _.isString( c[ 1 ] ) && c.length === 2 ) {
    colors = _.flatten( _.fill( Array( 35 ), c ) );
  }

  // init an empty array
  // TODO allow users to pass layers as arguments
  var colorLayers = [];

  // colors array prepared
  _.each( colors, function ( color, i ) {
    // console.log('start>>>', color, i)
    var tcColors = _.times('#000000', 35);

    if ( _.isPlainObject( color ) ) {
      // shape
      if ( _.has( color, 'spin')){
        color.color = tc(color.color).spin(color.spin);
      }

      if ( _.has( color, 'arc' ) ) {
        // draw arc degrees to lights 360 / 10 = 36
        var arcArray = _.times( Math.floor(color.arc / 10), function(){ return color.color } );
        _.each( arcArray, function(ac, i2){
          var targetIndex = color.start + i2 || i2;
          tcColors[ targetIndex ] = ac;
          color.end = targetIndex;
        })

        if ( color.blend === true ){
          // 245 = 24.5 - 24 = 0.5
          // draw next cell
          var blendAmt = ( color.arc / 10 ) - Math.floor(color.arc / 10);
          if ( blendAmt > 0 ){
            tcColors[ color.end+1 ] = tc(color.color).darken(( 1-blendAmt ) * 25);
          }
        }

      } else if ( _.has( color, 'angle' ) ) {
        // draw angle
        // 24.75


        if (color.angle < 0 ){
          // spin it right round again, like a record
          color.angle = 360 + color.angle;
        }
        color.angle = ( color.angle < 360 ) ? color.angle : color.angle % 360;
        var point = 35 * ( color.angle / 360 )
        if ( color.blend === true ) {
          // 24
          var base = Math.trunc( point );
          // .75
          var sub1Weight = point - base;
          // .25
          var sub2Weight = 1 - sub1Weight;

          var darkWeight = 25;

          tcColors[base] = tc( color.color ).darken(sub1Weight * darkWeight);
          tcColors[base+1] = tc( color.color ).darken(sub2Weight * darkWeight);
        } else {
          // default blend false
          var angleIndex = Math.round( point );
          tcColors[angleIndex] = color.color;
        }



      }

    } else {
      // process color with tiny color
      tcColors[ i ] = color;
    }

    // make every color a tc color
    tcColors = _.map(tcColors, function (c) {
      return tc(c);
    });

    //wrap end to beginning
    var tcLayers = _.chunk( tcColors, 35 )

    printLights(tcColors);

    // push wrapping layers to compose matrix
    _.each(tcLayers, function(t){
      colorLayers.push( t );
    })

    // console.log('end', tcColors, tcColors.length);
  })

  // composeLayers(colorLayers);

  // setTCColors(tcColors);

  var subFn = {
    brighten : function ( bi ) {
      _.each( colorLayers, function ( c, i ) {
        colorLayers[ i ] = c.brighten( bi );
      } )
    },

    darken : function ( di ) {
      _.each( colorLayers, function ( c, i ) {
        colorLayers[ i ] = c.darken( di );
      } )
    },

    rotate : function(steps){
      var index = Math.round(steps/35);
      for ( var i = 0; i <= index; i++){
        _.each(colorLayers, function(a){
          a.unshift(tc('#000000'));
        });
      }
      return subFn;
    },
    render: function(){
      composeLayers(colorLayers);
    }
  }

  return subFn;
}

// COLORS will be TC colors
function setTCColors( colors ) {
  var tcColors = [];
  _.each(colors, function(c){
    tcColors.push( tc(c) );
  })

  emitColorRing( tcColors );
}

var composeMix = true;

function composeLayers(layers){

  // uncomment to debug layering
  // console.log('== compStart vv');
  var i = 0;
  var final = _.reduce(layers, function (r, v) {
    // console.log( i++, printLights(v));
    // combine matrix of points with next layer
    _.each(v, function (c, i) {
      if ( composeMix === true){
        if ( c.isValid()){

        }
      }
      if ( c.isValid()){
        // straight replace
        r[i] = c;
      }
    });

    return r;
  },[])

  // console.log('=---= compDone');
  console.log('C :'.grey, printLights(final));
  emitColorRing(final);
}

//TC Colors to CMD
function emitColorRing( colors ) {
  // console.log('EMIT>>>>', colors, colors.length)
  // printColors(colors);
  colors = _.map(colors, function(c){
    if ( _.isUndefined(c)){
      return { r:0, g:0, b:0, a:0 };
    }
    return c.toRgb();
  })

  // colors should be { r: g: b: }
  process.send( {
    type: 'led-image',
    payload: colors
  });

}


function printColors( tcColors ){
  console.log( _.repeat(30, '='), 'CLOCK' )
  _.each(tcColors, function(c){
    console.log(c.getOriginalInput());
  })
}

function printLights( tcColors ){
  return _.reduce( tcColors, function(r, c){
    if ( _.isUndefined(c) || c.getBrightness() === 0 ){
      return r + ' '
    } else if ( c.isLight() ) {
      return r + ':';
    } else {
      return r + '.'.grey;
    }
  }, '');
}
