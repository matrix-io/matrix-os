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

const debug = debugLog('proto')
const protobuf = require('protobufjs');
const fs = require('fs')
const protosPath = ( process.env.MATRIX_MODE==='service') ? '/usr/share/matrix-proto' : __dirname + '/../../proto';

// check to see if protos exist, end if no
try {
  fs.accessSync( protosPath );
} catch (e) {
  console.error( "Protocol Buffers not found at ".red + protosPath);
  process.exit(1);
}

// monkey patch protobuf to add enum strings
var decode = protobuf.Reflect.Message.Field.prototype.decode;
protobuf.Reflect.Message.Field.prototype.decode = function () {
  var value = decode.apply(this, arguments);
  if (protobuf.TYPES["enum"] === this.type) {
    var values = this.resolvedType.children;
    for (var i=0; i<values.length; i++){
      if (values[i].id == value){
        return values[i].name;
      }
    }
  // add nested enums
  } else if (protobuf.TYPES["message"] === this.type ){
    _.each(this.resolvedType.children, function(c){
      var parent = c.name;
      if (protobuf.TYPES["enum"] === c.type) {
        var values = c.resolvedType.children;
        for (var i=0; i<values.length; i++){
          if (values[i].id == value[parent] ){
            value[parent] = values[i].name;
          }
        }
      }
    })
  }
  return value;
}


var files = fs.readdirSync(protosPath);

_.each(files, function(f){

  if ( fs.statSync(protosPath + '/' + f ).isDirectory() ){

    var ps = fs.readdirSync(protosPath + '/' + f );

    _.each(ps, function(p){
      if ( p.indexOf('.proto') > -1 ){
        debug( f, ':', p)
        // make sure we don't overwrite
        module.exports[f] = _.merge({}, module.exports[f]);
        // must build later
        module.exports[f][p.slice(0, -6)] =  protobuf.loadProtoFile(protosPath + '/' + f + '/' + p);
      }
    })
  }
})
