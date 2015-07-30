module.exports = {
  start: function startService() {
    Matrix.events.emit('service:start');
  },
  stop: function stopService() {
    Matrix.events.emit('service:stop');
  },
  updateLastBootTime: function(){
    Matrix.db.service.update({lastBoot : { $exists: true }}, { lastBoot: Date.now() }, {upsert: true });
  }
}
