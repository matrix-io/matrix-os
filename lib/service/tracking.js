/**
 * For managing CV Tracking
 */

var ids = new Set();
var info = {};
module.exports = {
  add: function(id){
    ids.add(id);
  },
  has: function(id){
    return ids.has(id)
  },
  dwellLookup: function(id){
    return info[id].dwell;
  },
  sessionLookup: function(id){
    return info[id].session
  },
  getIds: function(){
    return Array.from(ids);
  }
}
