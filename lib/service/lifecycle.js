module.exports = {
  start: function startService() {
    Matrix.events.emit('service:start');
  },
  stop: function stopService() {
    Matrix.events.emit('service:stop');
  }
}