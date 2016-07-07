var n = 0;
var up = true;
setInterval(function(){

  var redA = [], greenA, blueA;
  for ( var i = 0; i < 10; i++){
    var red = matrix.color('red').darken(i*5);
    redA.push(red);
    n++;
  }
  matrix.led(redA).rotate(n%35).render();

}, 50)
