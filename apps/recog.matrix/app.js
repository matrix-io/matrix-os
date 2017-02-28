matrix.on('reset', function(){
  matrix.service('recognition').untrain('test')
})

matrix.on('train', function(d) {
  var trained = false;
  console.log('training started>>>>>', d);
  matrix.init('recognition', { mode: 'train', tag: 'test' }).then(function(d) {
    if (!trained && d.hasOwnProperty('count')) {
      // means it's partially done
      matrix.led({
        arc: Math.round(360 * (d.count / d.target)),
        color: 'blue'
      }).render();
    } else {
      trained = true;
      matrix.led('blue');
      console.log('trained!', d);
    }
  });
});

//
// matrix.init('recognition', {tag: 'test'}).then(function (d) {
//   console.log('RECOGNIZED!!>!!>!>>!>!>!>', d);
// })

matrix.on('recog', function(d) {
  matrix.init('recognition', { tag: 'test' }).then(function(d) {
    console.log('RECOG>>>!', d);
    matrix.led('green').render();
  });
  console.log('recog!');
})