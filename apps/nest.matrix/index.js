matrix = require('./../matrix.js');
var appName = require('path').basename(__dirname).split('.')[0];
matrix.name(appName);
matrix.appConfig = JSON.parse( require('fs').readFileSync(__dirname + '/config.json'));
matrix.config = matrix.appConfig.configuration;


require('./app.js');

// kicks off app init process
matrix.startApp();
