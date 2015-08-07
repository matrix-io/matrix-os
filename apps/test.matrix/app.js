
matrix.init('test').has('res').above(984943658).then(function(err, data){
  if (err) console.error(err);
  if (data === false ){
    console.error('no match on filter'.red);
  } else {
    console.log('app:then>'.green, data);
  }
});
