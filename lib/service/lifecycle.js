module.exports = {
  updateLastBootTime: function(){
    Matrix.db.service.update({lastBoot : { $exists: true }}, { lastBoot: Date.now() }, {upsert: true });
  }
}
