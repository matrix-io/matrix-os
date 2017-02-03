var zb = matrix.zigbee;

matrix.zigbee.light().on();

matrix.on('face', function(){

var i = 0;
var l = _.throttle(matrix.zigbee.light().color, 5000, {trailing: false});
matrix.init('demographics').then(function(data){
  // console.log( require('util').inspect(data, {depth: null}));
  var hue = data.location.x;
  matrix.led({
    color: {
      // r: Math.round(Math.abs(data.demographics.pose.yaw) * 255),
      // g: Math.round(Math.abs(data.demographics.pose.roll) * 255),
      // b: Math.round(Math.abs(data.demographics.pose.pitch) * 255)
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
})

matrix.on('spin', function(){
  setInterval( function(){
    var hue = data.location.x;
    matrix.led({
      color: {
        // r: Math.round(Math.abs(data.demographics.pose.yaw) * 255),
        // g: Math.round(Math.abs(data.demographics.pose.roll) * 255),
        // b: Math.round(Math.abs(data.demographics.pose.pitch) * 255)
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
    matrix.zigbee.light().color(hue, 1);
  })
})

matrix.on('discover', function(){
  console.log(
  'discovery'
  )
  matrix.zigbee.discover();
});

matrix.on('reset', function(){
  console.log(
  'resety'
  )
  matrix.zigbee.reset();
});

matrix.on('toggle', function(){
  matrix.zigbee.light().toggle();
});
