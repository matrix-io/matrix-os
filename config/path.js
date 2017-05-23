var path = require('path');

// support SERVICE mode for autostart
var root = ( process.env.hasOwnProperty('MATRIX_MODE') && process.env.MATRIX_MODE === 'service') 
? '/var/matrix-store/' : path.join(__dirname,'../');

var p = {
  root: root,
  db: {
    device: root + 'db/device.db',
    config: root + 'db/config.db',
    user: root + 'db/user.db',
    service: root + 'db/service.db',
    pending: root + 'db/pending.db'
  },
  apps: root + 'apps',

  protos: root + 'proto',

  // logs

  appLog: root + 'apps/app.log'
};

if  ( process.env.hasOwnProperty('MATRIX_MODE') && process.env.MATRIX_MODE === 'service') {
  p.protos = '/etc/share/matrix-proto/';
}

module.exports = p;
