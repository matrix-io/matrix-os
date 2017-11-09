module.exports.init = function () {

  setInterval(function writeMaintenance() {
    if (Matrix.sendCache.length > 0) {
      let data = _.clone(Matrix.sendCache);
      debug(' write interval >>>>');
      Matrix.sendCache = [];

      // appemit data is the only one cached
      Matrix.service.stream.send('app-emit', data);
    }
  }, Matrix.config.writeInterval);

  setInterval(function writeLogs() {
    //transform so we can see the hours
    let t = 0;
    let d = Matrix.dailyDPCount;

    log('=== hourly writes ===');
    for (let i = 0; i < 24; i++) {
      log(i, d[i]);
      t += d[i];
    }

    log('day total: ', t);
  }, Matrix.config.writeLogInterval);

}