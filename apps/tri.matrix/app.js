
matrix.led([
  {
    arc: 45,
    color: matrix.color('blue').spin(i % 360),
    start: 360 - ( i % 360 )
  },
  {
    arc: 45,
    color: matrix.color('blue').spin(-i % 360),
    start: ( i % 360 )
  },
  {
    arc: 45,
    color: 'blue',
    start: ( i % 720 ) / 2
  },
]).render();
i += 1;
if ( i > 360 ) i = 0;
}, 50)
