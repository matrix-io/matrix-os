
matrix.init('mag').then(function(err, data){
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
//
// matrix.file.save('http://google.com', 'google.txt', function(err, result){
//   if (err) console.error(err);
//   // console.log(result);
// });
