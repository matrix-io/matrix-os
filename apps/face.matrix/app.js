matrix.led('blue').render();

var i = 0;

matrix.led([
  {
    angle: 45,
    color: matrix.color('yellow').spin(i),
    blend: true
  },
  {
    angle: 135,
    color: matrix.color('yellow').spin(-i)
  },
  {
    arc: 90,
    color: 'blue',
    start: 225,
    blend: true
  }
]).render();

matrix.init('face').then( function(data) {
  console.log('detection>>>>', data);
  if ( data.hasOwnProperty('x')){
    var angle = Math.atan2(data.x-0.5, data.y-0.5) * ( 180 / Math.PI);
    matrix.led({
      angle: angle-90,
      color: 'blue',
      blend: true
    });
    console.log('◃', angle+180);
  }
  //
  // matrix.led('#000011').render();
  // matrix.send(data);
});
