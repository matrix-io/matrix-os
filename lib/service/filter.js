// Not Yet Implmeneted / Tested Maybe this will be useful?

var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;
var apply = require('admobilize-eventfilter-sdk').apply;

module.exports = {
    get: getFilters,
    add: addFilter,
    remove: removeFilter,
    apply: applyFilter
}

function addFilter( filter, cb ){
  Matrix.db.insert({ filter: filter }, cb);
}

function removeFilter(filter, cb){
  Matrix.db.remove({ filter: filter }, cb);
}

function applyFilter(object){
  getFilters(function(err, filters){
    if (err) return new Error(err);
    return apply(filters, object);
  })
}

function getFilters(cb){
  Matrix.db.find({ 'filter' : { '$exists' : true }}, cb);
}
