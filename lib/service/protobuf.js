var protobuf = require('protobufjs');
const fs = require('fs')

fs.readdir('proto', function(err, files){
  if (err) console.error(err);
  log(files);
  _.each(files, function(f){
    console.log(f);
    module.exports[f.slice(0, -6)] = protobuf.loadProtoFile('./proto/' + f )
    console.log(module.exports)
  })
})
