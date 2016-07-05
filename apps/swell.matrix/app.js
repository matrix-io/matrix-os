var i = 0;
setInterval(function(){
  i++;
  var color = Matrix.color( '#' + _.repeat(i, 6));
  matrix.led(color.spin(i));
}, 50)
