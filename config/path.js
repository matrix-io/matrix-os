var path = require('path');
var root = path.join(__dirname,'../');

var p = {
  // notmade yet, these are modules
  freshRunModule: 'admatrix-fresh-run',
  terminalModule: 'admobilize-cli',

  root: root,
  db: {
    device: root + 'db/device.db',
    config: root + 'db/config.db',
    user: root + 'db/user.db',
    service: root + 'db/service.db',
    pending: root + 'db/pending.db'
  },
  pendingFiles: root + 'public/pending_files',
  update: root + 'tmp/updates/',

  splash: 'public/splash'
};

p.openCVInstallerFile = root + 'node_modules/' + p.freshRunModule + '/scripts/openCVInstall.sh';
p.watchdogInstallerFile = root + 'node_modules/' + p.freshRunModule + + '/scripts/watchdogInstall.sh';
p.watchdogCheckFile = root + 'node_modules/' + p.freshRunModule + + '/scripts/checkWatchdog.sh';
p.UV4LInstallerFile = root + 'node_modules/' + p.freshRunModule + + '/scripts/UV4L/UV4LInstall.sh';
p.UV4LCheckFile = root + 'node_modules/' + p.freshRunModule + + '/scripts/UV4L/checkUV4L.sh';

module.exports = p;
