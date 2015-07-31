var LineByLineReader = require('line-by-line');


module.exports = {
  reboot: reboot,
  setupDns: setupDns
}


/*
@method configureDNS
@description configures Google DNS servers
*/
function setupDns() {
  var dnsServerDetected = false;

  Matrix.device.manager.readLines(dnsFile, function (line) {
    if (line.indexOf("8.8.8.8") > -1) {
      dnsServerDetected = true;
    }
  }, function () {

    if (!dnsServerDetected) {
      var changeDNSCommand = 'sed -i "s@nameserver.*@nameserver 8.8.8.8@" /etc/resolv.conf';
      Matrix.device.daemon.exec(changeDNSCommand, function () { }, function () { }, function (command) {
        command.on('close', function (code) {
          if (code === 0) {
            log('Boot -- DNS server updated');
          } else {
            error('Boot -- Unable to update DNS server');
          }
        });
      });
    }
  });
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
  Matrix.device.daemon.executeCommand("sudo reboot",
    function (onStdout) { },
    function (onStderr) { },
    function (command) {
      command.on('close', function (code) {
        if (code === 0) {
          log('Reboot Initiated.')
        } else {
          cb(new Error('Unable to reboot device'));
        }
      });
    }
    );
}
