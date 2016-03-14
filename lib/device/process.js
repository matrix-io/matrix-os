module.exports = {
  kill: function(id){
    require('child_process').exec('kill '+ id )
  }
}
