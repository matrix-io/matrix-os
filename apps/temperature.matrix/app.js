
var cam1 = matrix.init('temperature').has('value').between(60,85).then(function(err, data){
  if (err) console.error(err);
  if (data === false ){
    console.error('no match on filter'.red);
  } else {
    console.log('app:then>'.green, data);
    matrix.sendData(data);
  }
});
