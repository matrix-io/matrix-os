matrix.init('gyroscope', { refresh: 1000 }).then(function(data){
  console.log('WOOOOT', data);
  var roll = Math.round(data.roll);
  matrix.led({
    angle: roll,
    color: 'blue',
    blend: true
  }).render();
})
//
// matrix.init('temperature').then(function(data){
//   console.log(data);
// })

//
// matrix.init('altitude').then(function(data){
//   console.log(data);
// })
//
//
// matrix.init('pressure').then(function(data){
//   console.log(data);
// })

//
// matrix.init('uv').then(function(data){
//   console.log(data);
// })
