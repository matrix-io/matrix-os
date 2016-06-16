var grpc = require('grpc')

const fs = require('fs')

fs.readdir('proto', function(err, files){
  if (err) console.error(err);
  _.each(files, function(f){
    // hopefully will keep same namespace?
    var exp = grpc.load('./proto/' + f )
    if ( _.has(exp, 'admobilize_vision')){
      console.log('GRPC:', f);
      module.exports[f.slice(0, -6)] = exp.admobilize_vision;
    } else {
      console.warn('Incorrect namespace for GRPC', f)
    }
  })
})
