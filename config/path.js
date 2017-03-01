var path = require('path');
var root = path.join(__dirname,'../');

var p = {
  root: root,
  db: {
    device: root + 'db/device.db',
    config: root + 'db/config.db',
    user: root + 'db/user.db',
    service: root + 'db/service.db',
    pending: root + 'db/pending.db',
    device: root + 'db/device.db'
  },
  pendingFiles: root + 'public/pending_files',
  update: '/tmp/matrix-update/',
  backup: '/tmp/matrix-backup/',

  splash: 'public/splash',

  // logs

  appLog: root + 'apps/app.log'
};


module.exports = p;
