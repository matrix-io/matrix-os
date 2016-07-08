var i = 0;

setInterval(function(){
matrix.led([
  {
    fade: 20,
    color: 'purple',
    start: ( ( i * 2 ) % 360)
  },
  // {
  //   fade: 20,
  //   color: 'teal',
  //   start: ( Math.abs(( -i * 1.5 )) % 360)
  // },
]).render();
i += 1;
if ( i > 360*360 ) i = 0;
}, 10)
