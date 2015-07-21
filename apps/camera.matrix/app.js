var send = matrix.send;
var receive = matrix.receive;

receive(function(){
  console.log('happy handling');
});

send('you suck');
