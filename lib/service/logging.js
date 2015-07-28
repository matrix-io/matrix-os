var winston = require('winston');
var Logentries = require('winston-logentries');

module.exports = {
  init: function() {
    var wlog = new(winston.Logger)({
      transports: [
        new(winston.transports.Console)({
          colorize: true
        }),
        // new(winston.transports.File)({
        //   filename: 'somefile.log'
        // }),
        new(winston.transports.Logentries)({
          token: 'b80a0207-e6d3-4aef-a7cf-4a787ca7ab41'
        })
      ]
    });


    if ( _.isString(process.env['ADMATRIX_DEVICE_ID'])) {
      wlog.addFilter(function(msg, meta, level) {
        return msg + ' [' + process.env['ADMATRIX_DEVICE_ID'] + ']';
      });
    } else {
      console.error('No ADMATRIX_DEVICE_ID env var. Logging will lack');
    }

      log = wlog.info;
      warn = wlog.warn;
      error = wlog.error;
  }
}
