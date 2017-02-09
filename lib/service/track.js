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
    debug('+'.blue, id);
    ids.add(id);
    debug( ids );
  },
  has: function(id){
    debug('?'.blue, id, ids);
    return ids.has(id)
  },
  remove: function(id){
    debug('-'.blue, id);
    ids.delete(id);
    debug( ids );
  },
  reset: function(){
    debug('x reset'.red, ids);
    ids.clear();
  },
  dwellLookup: function(id){
    debug('dwell', id, info[id].dwell)
    return info[id].dwell;
  },
  sessionLookup: function(id){
    debug('session', id, info[id].session)
    return info[id].session
  },
  getIds: function(){
    debug(ids);
    return Array.from(ids);
  },
  getInfo: function(){
    var idCollection = [];
    ids.forEach(function (id) {
      idCollection.push({
        id: id,
        session: info[id].session,
        dwell: info[id].dwell
      })
    })
    debug(idCollection);
    return idCollection;
  },
}
