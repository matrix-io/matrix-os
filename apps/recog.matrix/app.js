matrix.on('train', function(d){
  matrix.init('recognition', { mode: 'train', tag: 'test' }).then(function(d){
    console.log('trained!', d);
  });
  console.log('training started>>>>>', d);
});

//
// matrix.init('recognition', {tag: 'test'}).then(function (d) {
//   console.log('RECOGNIZED!!>!!>!>>!>!>!>', d);
// })

  matrix.init('recognition', { tag: 'test' }).then(function(d){
    console.log('RECOG>>>!', d);
  });
matrix.on('recog', function(d){
  console.log('recog!');
})
