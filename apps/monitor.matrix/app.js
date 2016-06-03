var os = require('os');
var EventEmitter = require('events');
var emitter = new EventEmitter();
var cpu = 0;
var memory = 0;

var monitor, device;

setInterval(function() {

}, 5000);

//
// monitor = setInterval(function() {
//   doMonitor();
// }, 2500 );

var i = 0;
var delayTime = 2500;

function restartMonitor (){
  clearInterval( monitor );
  monitor = setInterval(function() {
    doMonitor();
  }, delayTime );
}

matrix.on('buttonUp', function(){
  console.log('===========================', 'BUTTON!')
  matrix.type('test').send(i++);
})

matrix.on('buttonDown', function(){
  console.log('===========================', 'BUTTON!')
  matrix.type('test').send(i--);
})

matrix.on('buttonStop', function(){
  clearInterval( monitor );
})

matrix.on('buttonStart', function(){
  doMonitor();
  restartMonitor();
})

matrix.on('buttonSample', function () {
  doMonitor();
})


matrix.on('buttonFast', function () { delayTime += 1000; restartMonitor(); })
matrix.on('buttonSlow', function () { delayTime = Math.max(delayTime - 1000, 500); restartMonitor(); })

function doMonitor(){
  var loadavg = os.loadavg();
  var length = loadavg.length;
  var avg = loadavg.reduce(function(total, num) {
    return total + num;
  }, 0) / length;
  var memory = 1 - os.freemem() / os.totalmem();
  matrix.type('monitor').send({
      'cpu': avg + i,
      'memory': memory
  });
}

matrix.on('buttonInfo', function(){
  matrix.type('device').send({
    'os_hostname': os.hostname(),
    'os_type': os.type(),
    'os_platform': os.platform(),
    'os_arch': os.arch()
  });
})

// matrix.init('face')
