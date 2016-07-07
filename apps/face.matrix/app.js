matrix.led('blue').render();

var i = 0;
setInterval(function(){

// matrix.led([
//   {
//     angle: 45,
//     color: matrix.color('blue').spin(i),
//     blend: true
//   },
//   {
//     angle: 135,
//     color: matrix.color('blue').spin(-i)
//   },
//   {
//     arc: 90,
//     color: 'blue',
//     start: 225,
//     blend: true
//   }
// ])
// // .darken(90)
// .rotate(i*45).render();
// i += 1;
// }, 50)


matrix.led([
  {
    arc: 45,
    color: matrix.color('blue').spin(i % 360),
    start: 360 - ( i % 360 )
  },
  {
    arc: 45,
    color: matrix.color('blue').spin(-i % 360),
    start: ( i % 360 )
  },
  {
    arc: 45,
    color: 'blue',
    start: ( i % 720 ) / 2
  },
]).render();
i += 1;
if ( i > 360 ) i = 0;
}, 50)



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
