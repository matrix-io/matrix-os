var os = require('os');
var EventEmitter = require('events');
var emitter = new EventEmitter();
var cpu = 0;
var memory = 0;

matrix.send({ type: 'device', 
	'osHostname': os.hostname(),
	'osType': os.type(), 
	'osPlatform': os.platform(),
	'osArch': os.arch()
});

setInterval(function(){
		var loadavg = os.loadavg();
		var length = loadavg.length;
		var avg = loadavg.reduce(function(total, num){ return total + num }, 0)/length;
		var memory = 1 - os.freemem()/os.totalmem();
		matrix.send({ type: 'monitor', data: { 'cpu': avg, 'memory': memory } });
},1000);
