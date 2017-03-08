// app code goes here
// matrix.init()....
//
// have fun
matrix.led('red').render();

matrix.init('face').then(function(data){
  console.log('>>>>>>>>>>', data);
  matrix.led('green').render();
  setTimeout(function() {
  	matrix.led('black').render();
  },2000);
});
