
matrix.init('test').has('value').above(900000000).then(function(err, data){
  if (err) console.error(err);
  if (data === false ){
    console.error('no match on filter'.red);
  } else {
    console.log('app(test):then>'.green, data);
    matrix.send(data);
  }
});
