/**
 * For managing CV Tracking
 */
var debug = debugLog('track')

// Set of ids returned from tracker
var ids = new Set();

// ids saved by key
var info = {};
module.exports = {
  add: function(id){
    ids.add(id);
  },
  has: function(id){
    return ids.has(id)
  },
  remove: function(id){
    ids.delete(id);
  },
  reset: function(){
    ids.clear();
  },
  dwellLookup: function(id){
    return info[id].dwell;
  },
  sessionLookup: function(id){
    return info[id].session
  },
  ids: function(){
    return Array.from(ids);
  },
  info: function(){
    var idCollection = [];
    ids.forEach(function (id) {
      idCollection.push({
        id: id,
        session: info[id].session,
        dwell: info[id].dwell
      })
    })
  },
}
