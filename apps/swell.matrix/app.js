var i = 0;
var up = true;
var red = true;
var blue = true;
var green = true;

var switchBit = 0;
setInterval(function(){

  up = ( i >= 15) ? false : ( i <= 1) ? true : up;
  i = ( up ) ? (i+1) : (i -1);

  var color = matrix.color( '#' + _.repeat( i.toString(16), 2) + '0000');
  var led = matrix.led([color.darken(i*2).spin( i * 15 )]).rotate(i*40).render();
}, 50)
