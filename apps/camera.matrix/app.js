var send = matrix.send;
var receive = matrix.receive;
receive(function(data){
  console.log('[m]->App', data );
});

send('you suck');

var cam1 = matrix.init('camera').stream();

console.log(cam1.is('age', 20).json())
