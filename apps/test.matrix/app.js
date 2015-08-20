
matrix.init('test').has('value').above(900000000).then(function(err, data){
  if (err) console.error(err);
  if (data === false || typeof data === 'undefined' ){
    console.error('no match on filter'.red);
  } else {
    console.log('app(test):then>'.green, data);
    matrix.send(data);

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
