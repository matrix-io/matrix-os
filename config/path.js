var path = require('path');
var root = path.join(__dirname,'../');

var p = {
  // notmade yet, these are modules
  freshRunModule: 'admatrix-fresh-run',
  terminalModule: 'admobilize-cli',

  root: root,
  db: {
    device: root + 'db/device.json',
    config: root + 'db/config.json',
    user: root + 'db/user.json',
    service: root + 'db/service.json',
    pending: root + 'db/pending.json'
  },
  pendingFiles: root + 'public/pending_files',
  update: root + 'tmp/updates/'
};

p.openCVInstallerFile = root + 'node_modules/' + p.freshRunModule + '/scripts/openCVInstall.sh';
p.watchdogInstallerFile = root + 'node_modules/' + p.freshRunModule + + '/scripts/watchdogInstall.sh';
p.watchdogCheckFile = root + 'node_modules/' + p.freshRunModule + + '/scripts/checkWatchdog.sh';
p.UV4LInstallerFile = root + 'node_modules/' + p.freshRunModule + + '/scripts/UV4L/UV4LInstall.sh';
p.UV4LCheckFile = root + 'node_modules/' + p.freshRunModule + + '/scripts/UV4L/checkUV4L.sh';

module.exports = p;
