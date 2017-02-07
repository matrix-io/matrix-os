var piwifi = require('pi-wifi');
module.exports = {
  connect: function (ssid, password, cb) {
    var result = false;
    piwifi.connect(ssid, password, function (err) {
      if (!err) {
        setTimeout(function () {
          piwifi.check(ssid, function (err, status) {
            if (!err) result = status.connected;
            cb(err, result, status);
          });
        }, 1000);
      } else {
        cb(err, result);
      }
    });
  },
  connectOpen: function (ssid, cb) {
    var result = false;
    piwifi.connectOpen(ssid, function (err) {
      if (!err) {
        setTimeout(function () {
          piwifi.check(ssid, function (err, status) {
            if (!err) result = status.connected;
            cb(err, result, status);
          });
        }, 1000);
      } else {
        cb(err, result);
      }
    });
  },
  scan: piwifi.scan
}
