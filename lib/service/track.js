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
    ids.add(id.toString());
    info[id] = { descriptors: [] };
  },
  has: function(id){
    // debug('?'.blue, id, ids);
    return ids.has(id.toString())
  },
  remove: function(id){
    debug('-'.blue, id);
    ids.delete(id.toString());
    debug( ids );
  },
  reset: function(){
    debug('x reset'.red, ids);
    ids.clear();
  },
  addDescriptor: function(tId, descriptors){
    debug('+[]>', tId);
    if ( info[tId].descriptors.length < 10 ){
      info[tId].descriptors.push(descriptors);
    }
  },
  getDescriptors: function(tId){
    return info[tId].descriptors;
  },
  clearDescriptors: function(tId){
    info[tId].descriptors = [];
  },
  dwellLookup: function(id){
    return info[id.toString()].dwell;
  },
  sessionLookup: function(id){
    return info[id.toString()].session
  },
  getIds: function(){
    return Array.from(ids);
  },
  getInfo: function(){
    var idCollection = [];
    ids.forEach(function (id) {
      idCollection.push({
        id: id.toString(),
        session: info[id].session,
        dwell: info[id].dwell
      })
    })
    return idCollection;
  },
}
