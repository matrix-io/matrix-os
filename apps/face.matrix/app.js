matrix.init('face').then( function(data) {
  console.log('detection>>>>', data);
  if ( data.hasOwnProperty('x')){
    var angle = Math.atan2(data.x-.5, data.y-.5) * ( 180 / Math.PI)
    matrix.led({
      angle: angle-90,
      color: 'blue',
      blend: true
    }).render()
    console.log('◃', angle+180);
  }
  //
  // matrix.led('#000011').render();
  // matrix.send(data);
});
