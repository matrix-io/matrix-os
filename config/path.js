var os = os ? os : require('os'); //Added for bin folder commands as those don't have globals
var path = require('path');
var root = path.join(__dirname,'../');
var tmpFolder = os.tmpdir();

var p = {
  root: root,
  db: {
    device: root + 'db/device.db',
    config: root + 'db/config.db',
    user: root + 'db/user.db',
    service: root + 'db/service.db',
    pending: root + 'db/pending.db'
  },
  pendingFiles: root + 'public/pending_files',
  update: tmpFolder + '/matrix-update/',
  backup: tmpFolder + '/matrix-backup/',
  apps: root + 'apps',
  protos: root + 'proto',
  splash: 'public/splash',

  // logs

  appLog: root + 'apps/app.log'
};


module.exports = p;
