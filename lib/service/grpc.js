
const protos = require('matrix-protos');

module.exports = protos;

var debug = debugLog('grpc')

// var protobuf = require('protobufjs');
const Protos = require('matrix-protos').matrix_io;

let pExport = {};
for (let p in Protos) {

  // for keeping track of latest version when iterating
  let latestV = 0;
  for (let pv in Protos[p]) {
    // version integer
    let vInt = pv.replace(/\D/g, '');

    if (vInt > latestV) {
      latestV = vInt;
    }

    // automatically load newest protos available
    if (vInt === latestV) {
      let fns = [], others = [];

      for (let pi in Protos[p][pv]) {
        if (!_.isNull(pi.match(/get|store|delete|service|!Response$|!Request$/gi))) {
          // others.push(pi);
          fns.push(pi);
        }
      }
      pExport[p] = Protos[p]['v' + latestV];

      if (fns.length > 0) {
        debug('GRPC ::', p, 'v' + latestV)
        // debug('↳'.yellow, others.concat(fns).join(' ').grey)
      }
    }
  }
}

module.exports = pExport;

// const protosPath = __dirname + '/../../proto';
// var files = fs.readdirSync(protosPath);
// _.each(files, function(f){
//   // initialize container for this directory
//   module.exports[f] = {};

//   if ( fs.statSync(protosPath + '/' + f ).isDirectory() ){
//     var ps = fs.readdirSync(protosPath + '/' + f );

//     _.each(ps, function(p){
//       if ( p.indexOf('.proto') > -1 ){
//         var exp = grpc.load(protosPath + '/' + f + '/' + p );
//         if ( _.has(exp, 'admobilize_vision')){
//           module.exports[f][p.slice(0, -6)] = exp.admobilize_vision;
//           debug('GRPC:>', f, ':', p.slice(0, -6));

//         }
//       }
//     })
//   }
// })
