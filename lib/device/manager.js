module.exports = {
  reboot: reboot
}



/*
@method Reboot
@description Reboots with the provided description message
@param {String} description
@param {Function} [callback]
*/
function reboot(description, cb) {
  if ( _.isUndefined(cb)){
    cb = function(err){ error(err); }
  }

  log("Boot -- Rebooting " + description);
  var proc = require('child_process').exec("reboot",
    function(err, out, err){
      if (err) cb(err);
    });

  proc.on('exit', function(code, signal){
    log('Reboot Initiated: ', code);
  });
}
