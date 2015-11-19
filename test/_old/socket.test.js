var net = require('net');
var client = net.connect(80, '104.197.117.149',
// var client = net.connect(3000, 'localhost',
    function() { //'connect' listener
  console.log('connected to server!');
  client.write('world!\r\n');
});
client.on('data', function(data) {
  console.log(data.toString());
  client.end();
});
client.on('end', function() {
  console.log('disconnected from server');
});
client.on('error', function(err){
  if (err) console.error(err)
})
