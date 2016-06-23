var i = 0;

setInterval(function(){
  i = ( i < 350 ) ? i + 10 : 0;

  var spinLED = {
    // translate seconds (60) to angle (360)
    angle: i,
    color: 'darkblue',
    // blend: true,
    // spin: i
  };
  matrix.led( spinLED );
}, 50)
