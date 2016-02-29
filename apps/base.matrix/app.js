var os = require('os');
var EventEmitter = require('events');
var emitter = new EventEmitter();
var cpu = 0;
var memory = 0;

matrix.init('test').then( function(data) {
  matrix.send(data);
});
//
// setTimeout(function() {
//   matrix.send({
//     type: 'device',
//     data: {
//       'os_hostname': os.hostname(),
//       'os_type': os.type(),
//       'os_platform': os.platform(),
//       'os_arch': os.arch()
//     }
//   });
// }, 10000);
//
// setInterval(function() {
//   var loadavg = os.loadavg();
//   var length = loadavg.length;
//   var avg = loadavg.reduce(function(total, num) {
//     return total + num
//   }, 0) / length;
//   var memory = 1 - os.freemem() / os.totalmem();
//   matrix.send({
//     type: 'monitor',
//     data: {
//       'cpu': avg,
//       'memory': memory
//     }
//   });
// }, 5000);
//
// matrix.on(function(data){
//   console.log('global event', data);
// });
