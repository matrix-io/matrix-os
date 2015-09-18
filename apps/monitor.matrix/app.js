var os = require('os');
var EventEmitter = require('events');
var emitter = new EventEmitter();
var cpu = 0;
var memory = 0;

setInterval(function(){
		var loadavg = os.loadavg();
		console.log(loadavg);
		var length = loadavg.length;
		var avg = loadavg.reduce(function(total, num){ return total + num }, 0)/length;
		var memory = os.freemem()/os.totalmem();
		matrix.send({ type: 'monitor', data: { 'cpu': avg, 'memory': memory } });
},1000);