matrix.init('recognition', { mode: 'train', tag: 'test' }).then(function(d){
  console.log('trained!', d);
});
matrix.on('train', function(d){
  console.log('training started>>>>>', d);
});

matrix.on('recog', function(d){
  console.log('recog!');
  matrix.init('recognition', {tag: 'test'}).then(function (d) {
    console.log('RECOGNIZED!!>!!>!>>!>!>!>', d);
  })
})
