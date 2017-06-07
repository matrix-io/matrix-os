var path = require('path');
var root = path.join(__dirname,'../');

// for db and apps folders
if ( process.env.MATRIX_MODE === 'service'){
  root = '/var/matrix-os/store/';
}

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
  appLog: root + 'apps/app.log'
};

if ( process.env.MATRIX_MODE === 'service'){
  p.proto = '/usr/share/matrix-os/proto/';
}


module.exports = p;
