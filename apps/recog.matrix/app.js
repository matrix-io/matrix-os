matrix.led([
  'red',
  '',
  'cyan',
  'orange',
  'green'
]).render();


matrix.on('reset', function() {
  matrix.service('recognition').untrain('test')
  matrix.led('red').render()
  setTimeout(function() {
    matrix.led('black').render();
  }, 1000)
})



matrix.on('listtag', function() {

  matrix.service('recognition').getTags().then(function(tags) {
    matrix.led('green').render()
    setTimeout(function() {
      matrix.led('black').render();
    }, 1000);
    console.log('>>>>>>>>>>TAGS>>>>>>>>>>>>>>', tags);
  })
})

matrix.on('train', function(d) {


  var trained = false;
  console.log('training started>>>>>', d);
  // lighting
  var a = 180;
  var a2 = 0;
  var l = setInterval(function() {
    matrix.led([{
      arc: Math.round(180 * Math.sin(a)),
      color: 'darkgreen',
      start: a2
    }, {
      arc: -Math.round(180 * Math.sin(a)),
      color: 'darkgreen',
      start: a2 + 180
    }]).render();
    a = (a < 0) ? 180 : a - 0.1;
    //a2 = (a2 > 360) ? 0 : a2 + 5;
  }, 25);

  function stopLights() {
    clearInterval(l);
  }


  // console.log('>?>>>>',matrix.service('recognition').train('test'));
  var recog = matrix.service('recognition').train('test').then(function(d) {
    stopLights();
    if (!trained && d.hasOwnProperty('count')) {
      // means it's partially done
      matrix.led({
        arc: Math.round(360 * (d.count / d.target)),
        color: 'blue',
        start: 0
      }).render();
    } else {
      trained = true;
      matrix.led('blue').render();
      console.log('trained!', d);
      // todo: add stop
      recog.stop();

    }
  });
});

//
// matrix.init('recognition', {tag: 'test'}).then(function (d) {
//   console.log('RECOGNIZED!!>!!>!>>!>!>!>', d);
// })

matrix.on('recog', function(d) {
  // lighting
  var a = 180;
  var a2 = 90;
  var l = setInterval(function() {
    matrix.led([{
      arc: Math.round(180 * Math.sin(a)),
      color: 'darkblue',
      start: a2
    }, {
      arc: -Math.round(180 * Math.sin(a)),
      color: 'darkblue',
      start: a2 + 180
    }]).render();
    a = (a < 0) ? 180 : a - 0.1;
    //a2 = (a2 > 360) ? 0 : a2 + 5;
  }, 25);

  function stopLights() {
    clearInterval(l);
  }

  matrix.service('recognition').start('test').then(function(d) {
    stopLights();
    console.log('RECOG>>>!', d);
    matrix.led('green').render();
  });
})