
/**
 * protobuf.js
 * 
 * Protocol buffers are how MATRIX OS reads and writes to zero mq. They are data structures
 * which transform into binary payloads for high efficiency. Currently, MOS uses protobufs 
 * to communicate with MALOS and Vision Services. In the future, we may use protobufs for 
 * app data and mxss communication
 * 
 * Note the patch to resolve enums into strings. You're welcome.
 * 
 * @exports malos.driver - hardware sensors, incl zigbee for now
 * @exports vision.vision - base class for vision service engine: detection, demographic
 * @exports vision.vision_service - methods for integration with vision
 * @exports vision.recognition - base class for service
 * @exports vision.recognition_service - methods for integration with recognition
 */

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

