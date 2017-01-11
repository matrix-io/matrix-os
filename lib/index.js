var version = require('../package.json').version;

var f = {is : '=<[^\\/^]>=', banner: function(){
  log(' _  _ ____ ___ ____ _ _  _ '.red);
  log(' |\\/| |__|  |  |__/ |  \\/  '.green,'[o__o]'.grey );
  log(' |  | |  |  |  |  \\ | _/\\_ '.blue, 'v'+version );
}};

var files = require('fs').readdirSync(__dirname);

//remove self
files.splice(files.indexOf(require('path').basename(__filename)), 1);
log("Loading Core Matrix Files");
files.forEach(function(file) {
  log('Loading... '.grey, file);
  f[file] = require('./' + file);
});

module.exports = f;

/* >> hidden files filter proposition <<
var fs = require('fs'), junk = require('junk');

fs.readdir(__dirname, function (err, file) {
  var files = file.filter(junk.not);
  
  log("Loading Core Matrix Files");
  
  files.forEach(function(file) {
    log('Loading... '.grey, file);
    f[file] = require('./' + file);
  });
});
*/
