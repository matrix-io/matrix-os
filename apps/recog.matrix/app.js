// app code goes here
// matrix.init()....
//
// have fun
//

matrix.on('train', function(d){
  console.log('training started>>>>>', d);
  matrix.init('recognition', { mode: 'train', tag: 'test' }).then(function(d){
    console.log('trained!', d);
  });
});
