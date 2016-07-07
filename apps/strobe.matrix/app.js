var i = 0;
var up = true;
setInterval(function(){

  i = ( up ) ? (i+1) % 16 : (i -1) % 16;
  up = ( i === 16 || i === 0 ) ? !up: up;

  var color = matrix.color( '#' + _.repeat(i.toString(16), 6));
  console.log(color)
  matrix.led([color.spin(i)]);
}, 50)
