var EventFilter = require('admobilize-eventfilter-sdk').EventFilter;
var apply = require('admobilize-eventfilter-sdk').apply;

module.exports = {
    get: getFilters,
    add: addFilter,
    remove: removeFilter,
    save: saveFilter,
    apply: applyFilter
}

function addFilter( filter, cb ){
  Matrix.db.insert({ filter: filter }, cb);
}

function removeFilter(filter, cb){
  Matrix.db.remove({ filter: filter }, cb);
}

function saveFilter(){

}

function applyFilter(){

}

function getFilters(){

}
