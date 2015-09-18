console.log('app>[L]->accel');
matrix.init('accel').then(function(err, data){
  console.log('app(accel):then>'.green, data);
  if (err) console.error(err);
  if (data === false || typeof data === 'undefined' ){
    console.error('no match on filter'.red);
  } else {
    // console.log('app(accel):then>'.green, data);
    matrix.send({ 'type': 'accel', data: { x: Math.ceil(Math.random(0,1)*10), y: Math.ceil(Math.random(0,1)*10), z: Math.ceil(Math.random(0,1)*10) }});

    //test specific app + event
    // matrix.notify('test-event','doTest', data);

    //test specific app
    // matrix.notify('test-event', {global: false});

    //test global
    //matrix.notify({global:true});
  }
});

matrix.on(function(data){
  console.log('recieved global message'.blue, data);
});
//
// matrix.file.save('http://google.com', 'google.txt', function(err, result){
//   if (err) console.error(err);
//   // console.log(result);
// });
