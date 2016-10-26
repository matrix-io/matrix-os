module.exports = {

  /* Expects { name, options } */
  handler: function(ev){
    if ( !_.isNull(ev.name.match(/(palm|pinch|fist|thumb-up)/)) ){

    } else if ( !_.isNull(ev.name.match(/(face|vehicle/)))){
      
    }
  }
}
