var protobuf = require('protobufjs');
const fs = require('fs')


var files = fs.readdirSync('proto');

_.each(files, function(f){

  if ( fs.statSync('./proto/' + f ).isDirectory() ){

    var ps = fs.readdirSync('./proto/' + f );

    _.each(ps, function(p){
      if ( p.indexOf('.proto') > -1 ){
        console.log('protobuf'.grey, f, ':', p)
        module.exports[f] = {};
        module.exports[f][p.slice(0, -6)] =
          protobuf.loadProtoFile('./proto/' + f + '/' + p);
      }
    })
  }
})
