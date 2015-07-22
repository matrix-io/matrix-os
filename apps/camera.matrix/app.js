
var cam1 = matrix.init('camera').then(function(err, data){
  if (err) console.error(err)
  console.log('app:then', data);
});

console.log(cam1);
// console.log('app:filter:', cam1.is('age', 20).json());
