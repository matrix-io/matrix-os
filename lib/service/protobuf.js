var protobuf = require('protobufjs');
const fs = require('fs')


var files = fs.readdirSync('proto');
  _.each(files, function(f){
    console.log('Protobuf'.grey, f.slice(0, -6));
    module.exports[f.slice(0, -6)] = protobuf.loadProtoFile('./proto/' + f )
    // console.log(module.exports)
  })
