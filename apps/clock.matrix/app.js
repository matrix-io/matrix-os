setInterval(function(){
  var time = new Date();
  var h = time.getHours();
  var m = time.getMinutes();
  var s = time.getSeconds();
  var ms = time.getMilliseconds();

  // ampm normalize
  h = ( h > 12 ) ? h - 12 : h;

  var hourLED = {
    // translate hours (12) to angle (360)
    angle: (h * 30),
    color: 'darkred',
    darken: 50,
    blend: true
  };

  var minuteLED = {
    // translate minutes ( 60 ) to angle ( 360 )
    angle: m * 6,
    color: 'green'
  };

  var secondLED = {
    // translate seconds (60) to angle (360)
    arc: (s + (ms/1000)) * 6,
    color: 'indigo',
    blend: true
  };

  matrix.led(['white', secondLED, minuteLED, hourLED ]);

}, 50)
