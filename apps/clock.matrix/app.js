var i = 0;

setInterval(function(){
  var time = new Date();
  var h = time.getHours();
  var m = time.getMinutes();
  var s = time.getSeconds();
  var ms = time.getMilliseconds();

  // ampm normalize
  h = ( h > 12 ) ? h - 12 : h;

  var hourLED = {
    // translate hours (12) + minutes (0-60 = 0-1 ) to angle (360)
    angle: (h + ( m / 60 ) + ( s/3600 )) * 30,
    color: 'darkred',
    blend: true
  };

  var minuteLED = {
    // translate minutes ( 60 ) to angle ( 360 )
    angle: ( m + (s/60) + ( ms/60000 ) ) * 6,
    color: 'green',
    blend: true
  };

  var secondLED = {
    // translate seconds (60) to angle (360)
    angle: (s + (ms/1000)) * 6,
    color: 'darkblue',
    blend: true,
    spin: i
  };

  i = ( i < 360 ) ? i + 1 : 0;

  matrix.led([ secondLED, minuteLED, hourLED ]).render();
}, 50);
