// We use GRPC to communicate with the MALOS.

var grpc = require('grpc')

const fs = require('fs')

var files = fs.readdirSync('proto');
_.each(files, function(f){

  if ( fs.statSync('./proto/' + f ).isDirectory() ){
    var ps = fs.readdirSync('./proto/' + f );

    _.each(ps, function(p){
      if ( p.indexOf('.proto') > -1 ){
        var exp = grpc.load('./proto/' + f + '/' + p );
        if ( _.has(exp, 'admobilize_vision')){
          console.log('GRPC:', f, ':', p);
          module.exports[f] = {};
          module.exports[f][p.slice(0, -6)] = exp.admobilize_vision;
        }
      }
    })
  }
})
