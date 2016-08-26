matrix.init('gyroscope', { refresh: 1000 }).then(function(data){
  console.log('WOOOOT', data);
  var roll = Math.round(data.roll);
  matrix.led({
    angle: roll,
    color: 'blue',
    blend: true
  }).render();
})
