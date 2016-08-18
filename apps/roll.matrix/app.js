matrix.init('gyroscope', { refresh: 100 }).then(function(data){
  console.log('WOOOOT', data);
  var roll = Math.round(data.roll);
  matrix.led({
    angle: roll,
    color: 'blue',
    blend: true
  }).render();
})
