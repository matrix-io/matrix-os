matrix.on('reset', function() {
  matrix.service('recognition').untrain('test')
  matrix.led('red').render()
  setTimeout(function() {
    matrix.led('black').render();
  }, 1000)
})

matrix.on('listtag', function() {
  matrix.service('recognition').getTags().then(function(tags) {
    console.log('>>>>>>>>>>TAGS>>>>>>>>>>>>>>', tags);
  })
})

matrix.on('train', function(d) {
  var trained = false;
  console.log('training started>>>>>', d);
  matrix.service('recognition').train('test').then(function(d) {
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