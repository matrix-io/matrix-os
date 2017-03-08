// app code goes here
// matrix.init()....
//
// have fun
matrix.emit({foo: 'global'});
matrix.emit('eventTest', {foo: 'app'});
matrix.emit('eventTest', 'fooEvent', {foo: 'event'});


matrix.on(function(data){
  console.log('global/app', data.foo);
});

matrix.on('fooEvent', function(data){
  console.log('event', data.foo);
});
