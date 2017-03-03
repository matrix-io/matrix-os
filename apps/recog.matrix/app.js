// lighting
var a = 180;
var a2 = 0;
var l = setInterval(function() {
  matrix.led([{
    arc: Math.round(145 * Math.sin(a)),
    color: 'green',
    start: a2
  }, {
    arc: -Math.round(145 * Math.sin(a)),
    color: 'blue',
    start: a2 + 180
  }]).render();
  a = (a < 0) ? 180 : a - 0.1;
  a2 = (a2 > 360) ? 0 : a2 + 1;
}, 25);

function stopLights() {
  clearInterval(l);
}






matrix.on('reset', function() {
  stopLights();
  matrix.service('recognition').untrain('test')
  matrix.led('red').render()
  setTimeout(function() {
    matrix.led('black').render();
  }, 1000)
})



matrix.on('listtag', function() {

  stopLights();
  matrix.service('recognition').getTags().then(function(tags) {
    console.log('>>>>>>>>>>TAGS>>>>>>>>>>>>>>', tags);
  })
})

matrix.on('train', function(d) {

  stopLights();
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

  stopLights();
  matrix.init('recognition', { tag: 'test' }).then(function(d) {
    console.log('RECOG>>>!', d);
    matrix.led('green').render();
  });
  console.log('recog!');
})