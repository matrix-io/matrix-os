var os = require('os');
var EventEmitter = require('events');
var emitter = new EventEmitter();
var cpu = 0;
var memory = 0;

setTimeout(function() {
  matrix.type('device').send({
    'os_hostname': os.hostname(),
    'os_type': os.type(),
    'os_platform': os.platform(),
    'os_arch': os.arch()
  });
}, 1000);

setInterval(function() {
  var loadavg = os.loadavg();
  var length = loadavg.length;
  var avg = loadavg.reduce(function(total, num) {
    return total + num;
  }, 0) / length;
  var memory = 1 - os.freemem() / os.totalmem();
  matrix.type('monitor').send({
      'cpu': avg,
      'memory': memory
  });
}, 500);
