//* The server we're running
//
var f = {
  init: function(){
    files.forEach(function(file){
      log(file.slice(0, -3), 'event listener init');
      f[file.slice(0,-3)].init();
    });
  }
};

  var files = require('fs').readdirSync(__dirname);

  //remove self
  files.splice(files.indexOf(require('path').basename(__filename)), 1);

  files.forEach(function(file) {
    f[file.slice(0,-3)] = require('./' + file);

  });

  f.init = function(){
    for (var i in f){
      if( f[i].init ){
        f[i].init();
      }
    }
  }

  module.exports = f;

