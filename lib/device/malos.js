module.exports = {
  info: function (cb) {
    var DriverInfo = Matrix.service.protobuf.malos.driver;
    Matrix.service.zeromq.deviceInfo(function (response) {
      var re = DriverInfo.MalosDriverInfo.decode(response);
      cb(re);
    });
  }
}
