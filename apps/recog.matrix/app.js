// app code goes here
// matrix.init()....
//
// have fun
matrix.on('train', function(){
  console.log('training started>>>>>')
  matrix.train('test').then(function(d){
    console.log('trained!', d)
  })
})
