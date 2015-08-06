var events = require("events");
var util = require("util");
var df = require("df");

var enoughFreeSpace = true;

/*
@method getAvailableSpace
@parameter {Function} callback
@description Get the  system available space
*/
function getAvailableSpace(callback) {
 df(function (error, result) {
  if (!error) {
    for(var indexResult in result){
      if(result[indexResult].filesystem == '/dev/root'){
       callback(null , result[indexResult].available);
     }
   }
 }else{
  callback(error);
}
});
}
/*
@method freeSpace
@description Return free space
*/
function validateFreeSpace () {
  var spaceLimit = Matrix.config.spaceLimit;
  spaceLimit = spaceLimit || 0;
  getAvailableSpace(function(error, availableSpace) {
    if(availableSpace <= spaceLimit ){
      if(enoughFreeSpace){
        Matrix.events.emit('no-free-space');
        enoughFreeSpace = false;
      }
    }else{
      if(!enoughFreeSpace){
        enoughFreeSpace = true;
        Matrix.events.emit('space-released');
      }
    }
  });
}


/*
@method enoughSpace
@param  fileWeight
@param  extraSpace
@description Return if there is enough space in the system
*/
function enoughSpace(fileWeight, extraSpace, callback) {
  var spaceLimit = Matrix.config.spaceLimit;
  spaceLimit = spaceLimit || 0;
  getAvailableSpace(function(error, availableSpace) {
    var available = extraSpace?availableSpace + extraSpace : availableSpace
    var disponible = available-fileWeight;

    if((available-fileWeight) >= spaceLimit ){
      callback(true);
    }else{
      callback(false);
    }
  });
}


module.exports =  {
  freeSpace: getAvailableSpace,
 validateFreeSpace: validateFreeSpace,
 enoughSpace: enoughSpace
}
