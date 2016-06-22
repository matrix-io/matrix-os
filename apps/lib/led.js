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
    colors = _.times( 36, c );
  }

  // interleave
  if ( _.isString( c[ 0 ] ) && _.isString( c[ 1 ] ) && c.length === 2 ) {
    colors = _.flatten( _.fill( Array( 36 ), c ) );
  }

  // init an empty array
  var tcColors = Array( 36 );

  // colors array prepared
  _.each( colors, function ( color, i ) {
    // console.log('start>>>', color, i)

    if ( _.isPlainObject( color ) ) {
      // shape
      if ( _.has( color, 'arc' ) ) {
        // draw arc degrees to lights 360 / 10 = 36
        var arcArray = _.times( Math.floor(color.arc / 10), function(){ return color.color } );
        console.log('arcArray', arcArray.length);
        _.each( arcArray, function(ac, i2){
          var targetIndex = color.start + i2 || i2;
          tcColors[ targetIndex ] = ac;
          color.end = targetIndex;
        })

        if ( color.blend === true ){
          // 245 = 24.5 - 24 = 0.5
          // draw next cell
          var blendAmt = ( color.arc / 10 ) - Math.floor(color.arc / 10);
          tcColors[ color.end+1 ] = tc(color.color).darken(( 1-blendAmt ) * 50);
        }

      } else if ( _.has( color, 'angle' ) ) {
        // draw angle
        // 24.75
        var point = 36 * ( color.angle / 360 )
        if ( color.blend === true ) {
          // 24
          var base = Math.trunc( point );
          // .75
          var sub1Weight = point - base;
          // .25
          var sub2Weight = 1 - sub1Weight;

          tcColors[base] = tc( color.color ).darken(sub1Weight * 50);
          tcColors[base+1] = tc( color.color ).darken(sub2Weight * 50);
        } else {
          // default blend false
          var angleIndex = Math.floor( point );
          tcColors[angleIndex] = color.color;
        }



      }

    } else {
      // process color with tiny color
      tcColors[ i ] = color;
    }

    // console.log('end', tcColors, tcColors.length);
  })

  setTCColors(tcColors);

  return function subMethods( tcColors ) {
    var self = this;
    self.brighten = function ( bi ) {
      _.each( tcColors, function ( c, i ) {
        tcColors[ i ] = c.brighten( bi );
      } )
    };

    self.darken = function ( di ) {
      _.each( tcColors, function ( c, i ) {
        tcColors[ i ] = c.darken( di );
      } )
    };

    setLED( tcColors );

    return self;
  }
}

// COLORS will be TC colors
function setTCColors( colors ) {
  var tcColors = [];
  _.each(colors, function(c){
    //TODO: remove darken
    tcColors.push( tc(c) );
  })
  emitColorRing( tcColors );
}

//TC Colors to CMD
function emitColorRing( colors ) {
  // console.log('EMIT>>>>', colors, colors.length)
  // printColors(colors);
  colors = _.map(colors, function(c){
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
