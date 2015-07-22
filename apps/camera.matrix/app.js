
var cam1 = matrix.init('camera').stream().then(function(data){});

console.log('app:filter:', cam1.is('age', 20).json());
