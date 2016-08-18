var appName = require('path').basename(__dirname).split('.')[0];

matrix = require('./../matrix.js')

matrix.startApp(appName);

matrix.ready(function(){
  require('./app.js');  
})
