var protobuf = require('protobufjs');
const fs = require('fs')

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


var files = fs.readdirSync('proto');

_.each(files, function(f){

  if ( fs.statSync('./proto/' + f ).isDirectory() ){

    var ps = fs.readdirSync('./proto/' + f );

    _.each(ps, function(p){
      if ( p.indexOf('.proto') > -1 ){
        console.log('protobuf'.grey, f, ':', p)
        // make sure we don't overwrite
        module.exports[f] = _.merge({}, module.exports[f]);
        // must build later
        module.exports[f][p.slice(0, -6)] =  protobuf.loadProtoFile('./proto/' + f + '/' + p);
       }
    })
  }
})

console.log(module.exports);
