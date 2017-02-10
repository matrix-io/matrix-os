// app code goes here
// matrix.init()....
//
// have fun
//

matrix.on('train', function(d){
  console.log('training started>>>>>', d);
  matrix.train('test').then(function(d){
    console.log('trained!', d);
  });
});
