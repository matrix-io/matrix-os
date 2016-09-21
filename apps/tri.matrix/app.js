var i = 0;

setInterval(function(){
matrix.led([
  {
    arc: 120,
    // color: matrix.color('blue').spin(i % 360),
    color: 'red',
    start: 360 - ( i % 360 ),
    blend: true
  },

  {
    fade: 10,
    color: 'purple',
    start: ( ( i * 2 ) % 360)
  },
  {
    arc: 120,
    // color: matrix.color('blue').spin(-1 * (i % 360)),
    color: 'green',
    start: ( i % 360 ),
    blend: true
  },
  {
    arc: 120,
    color: 'blue',
    start: ( i % 720 ) / 2,
    blend: true
  },
]).render();
i += 1;
if ( i > 360*360 ) i = 0;
}, 10)
