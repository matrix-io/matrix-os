var i = 0;

setInterval(function(){
  i = ( i < 350 ) ? i + 10 : 0;

  var blue = {
    // translate seconds (60) to angle (360)
    arc: 90,
    color: 'blue',
    start: 26
    // blend: true,
    // spin: i
  };
  matrix.led( [ 'red', 'white'] );
  matrix.led( blue );
}, 50)
