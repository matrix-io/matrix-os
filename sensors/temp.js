module.exports = {
  init: function(){},
  faker: function(){
    setInterval(function(){
      Matrix.events.emit('sensor-emit', {
        'type': 'temperature',
        'value': Math.round(Math.random()*50) + 26
      })
    }, 1000)
  }
}