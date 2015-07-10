var fs = require('fs');

module.exports = {
  get: function(){
    return JSON.parse(fs.readFileSync('./config/_state.json'));
  },
  set: function(state){
    return fs.writeFileSync('./config/_state.json', JSON.stringify(state));
  }
}