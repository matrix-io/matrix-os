// We use GRPC to communicate with the MALOS and external services

var grpc = require('grpc');
var debug = debugLog('grpc');


const fs = require('fs')
const protosPath = __dirname + '/../../proto';
var files = fs.readdirSync(protosPath);
_.each(files, function(f){
  // initialize container for this directory
  module.exports[f] = {};

  if ( fs.statSync(protosPath + '/' + f ).isDirectory() ){
    var ps = fs.readdirSync(protosPath + '/' + f );

    _.each(ps, function(p){
      if ( p.indexOf('.proto') > -1 ){
        var exp = grpc.load(protosPath + '/' + f + '/' + p );
        if ( _.has(exp, 'admobilize_vision')){
          module.exports[f][p.slice(0, -6)] = exp.admobilize_vision;
          debug('GRPC:>', f, ':', p.slice(0, -6));

        }
      }
    })
  }
})
