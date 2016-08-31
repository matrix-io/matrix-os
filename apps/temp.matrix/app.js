matrix.init('temperature', { refresh: 1000 }).then(function(data){
  console.log('WOOOOT', data);
  var roll = Math.round(data.value);
  matrix.led({
    angle: roll,
    color: 'blue',
    blend: true
  }).render();
})

matrix.init('humidity', {refresh: 1000}).then(function(data){
  console.log('HUMID', data.value)
})
