var zb = matrix.zigbee;

matrix.zigbee().light().on();

matrix.on('face', function(){

var i = 0;
var l = _.throttle(matrix.zigbee().light().color, 5000, {trailing: false});
matrix.init('demographics').then(function(data){
  // console.log( require('util').inspect(data, {depth: null}));
  var hue = data.location.x;
  matrix.led({
    color: {
      // r: Math.round(Math.abs(data.demographics.pose.yaw) * 255),
      // g: Math.round(Math.abs(data.demographics.pose.roll) * 255),
      // b: Math.round(Math.abs(data.demographics.pose.pitch) * 255);
      h: hue,
      s: 1,
      l: 0.5
    },
    start: i++,
    fade: i++
  }).render();

  if ( i > 35 ){
    i = 0;
  }
  l(hue, 1);
  l.cancel();
});
});

var spin;
matrix.on('spin', function(){
  var hue = 0;
  var i = 0;
  setInterval( function(){
    spin = matrix.led({
      color: {
        // r: Math.round(Math.abs(data.demographics.pose.yaw) * 255),
        // g: Math.round(Math.abs(data.demographics.pose.roll) * 255),
        // b: Math.round(Math.abs(data.demographics.pose.pitch) * 255);
        h: hue++,
        s: 1,
        l: 0.5
      },
      start: i++,
      fade: i++
    }).render();

    if ( i > 35 ){
      i = 0;
    }

    if ( hue > 360){
      hue = 0;
    }

    if ( hue % 10 === 0){
      matrix.zigbee().light().color(hue, 1);
    }
  }, 50);
});

matrix.on('stop', function(){
  clearInterval(spin);
});

matrix.on('discover', function(){
  matrix.zigbee().discover();
});

matrix.on('reset', function(){
  matrix.zigbee().reset();
});

matrix.on('toggle', function(){
  matrix.zigbee().light().toggle();
});

matrix.on('off', function(){
  matrix.zigbee().light().fadeOut(10);
});

matrix.on('on', function(){
  matrix.zigbee().light().fadeIn(10);
});

matrix.on('dim', function(){
  matrix.zigbee().light().level(10, 5);
});

matrix.on('royal', function(){
  matrix.zigbee().light().level(50, 30);
  matrix.zigbee().light().color('purple');
});

matrix.on('work', function(){
  matrix.zigbee().light().fadeIn(10);
  matrix.zigbee().light().color('green');
});

matrix.on('wake', function(){
  matrix.zigbee().light().fadeIn(10);
  matrix.zigbee().light().color('orange');
});

matrix.on('sleep', function(){
  matrix.zigbee().light().fadeOut(100);
  matrix.zigbee().light().color('darkblue');
});
