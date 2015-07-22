
var cam1 = matrix.init('temperature').has('value').between(60,85).then(function(err, data){
  if (err) console.error(err);
  if (data === false ){
    console.error('no match on filter'.red);
  } else {
    console.log('app:then>'.green, data);
  }
});

console.log(cam1);
// console.log('app:filter:', cam1.is('age', 20).json());
