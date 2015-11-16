var debug = debugLog('events')

module.exports = {
  init: function(){
    // Matrix.events.on('no-free-space');
    // Matrix.events.on('space-released');
    Matrix.events.on('device-reboot', function(){
      debug('device-reboot');
      Matrix.device.manager.reboot(function(err){
        if (err) console.error(err);
      })
    });
  }
}
