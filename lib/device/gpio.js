var debug = debugLog('gpio');

module.exports = {
  open: function(options){

    Matrix.events.emit('gpio-emit', { hello: true, user: 'diego' })
  },
  close: function(pin){

  },
  write: function(pin, value){
    console.log('GPIO Write Not Implemented Yet')
  }
}
