var version = require(__dirname + '/../package.json').version;

var f = {
  is: '=<[^\\/^]>=', banner: function () {
    log(' _  _ ____ ___ ____ _ _  _ '.red);
    log(' |\\/| |__|  |  |__/ |  \\/  '.green, '[o__o]'.grey);
    log(' |  | |  |  |  |  \\ | _/\\_ '.blue, 'v' + version + '-' + Matrix.currentHash);
  }
};

try {
  f.currentHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (err) {
  f.currentHash = 'nohash';
}

var files = require('fs').readdirSync(__dirname);

//remove self
files.splice(files.indexOf(require('path').basename(__filename)), 1);
files.forEach(function (file) {
  log('Loading... '.grey, file);
  f[file] = require('./' + file);
});

module.exports = f;