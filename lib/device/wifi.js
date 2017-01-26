var piwifi = require('pi-wifi');
module.exports = {
  connect: piwifi.connect,
  connectOpen: piwifi.connectOpen,
  scan: piwifi.scan
}
