var zb = matrix.zigbee;

matrix.zigbee.light().off();
var i = 0;

matrix.init('demographics').then(function(data){
  var hue = data.location.y;
  matrix.led({
    color: {
      r: Math.round(Math.abs(data.demographics.pose.yaw) * 255),
      g: Math.round(Math.abs(data.demographics.pose.roll) * 255),
      b: Math.round(Math.abs(data.demographics.pose.pitch) * 255)
    },
    start: i++,
    fade: i++
  }).render();

  if ( i > 35 ){
    i = 0;
  }
  matrix.zigbee.light().on();
});

matrix.on('discover', function(){
  matrix.zigbee.net().discover();
});
matrix.on('toggle', function(){
  matrix.zigbee.light().toggle();
});
