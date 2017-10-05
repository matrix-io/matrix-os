var debug = debugLog('proto')

// var protobuf = require('protobufjs');
const Protos = require('matrix-protos').matrix_io;
const grpc = require('grpc');

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


      pExport[p] = Protos[p]['v' + latestV];

      debug('Protobuf ::', p, 'v' + latestV)
    }
  }
}

// grpc is based on proto objects


module.exports = pExport;

require('./grpc.js').populate(pExport);

// const fs = require('fs')
// const protosPath = __dirname + '/../../proto';
// // monkey patch protobuf to add enum strings
// var decode = protobuf.Reflect.Message.Field.prototype.decode;
// protobuf.Reflect.Message.Field.prototype.decode = function () {
//   var value = decode.apply(this, arguments);
//   if (protobuf.TYPES["enum"] === this.type) {
//     var values = this.resolvedType.children;
//     for (var i = 0; i < values.length; i++) {
//       if (values[i].id == value) {
//         return values[i].name;
//       }
//     }
//     // add nested enums
//   } else if (protobuf.TYPES["message"] === this.type) {
//     _.each(this.resolvedType.children, function (c) {
//       var parent = c.name;
//       if (protobuf.TYPES["enum"] === c.type) {
//         var values = c.resolvedType.children;
//         for (var i = 0; i < values.length; i++) {
//           if (values[i].id == value[parent]) {
//             value[parent] = values[i].name;
//           }
//         }
//       }
//     })
//   }
//   return value;
// }


// var files = fs.readdirSync(protosPath);

// _.each(files, function (f) {

//   if (fs.statSync(protosPath + '/' + f).isDirectory()) {

//     var ps = fs.readdirSync(protosPath + '/' + f);

//     _.each(ps, function (p) {
//       if (p.indexOf('.proto') > -1) {
//         debug(f, ':', p)
//         // make sure we don't overwrite
//         module.exports[f] = _.merge({}, module.exports[f]);
//         // must build later
//         module.exports[f][p.slice(0, -6)] = protobuf.loadProtoFile(protosPath + '/' + f + '/' + p);
//       }
//     })
//   }
// })
