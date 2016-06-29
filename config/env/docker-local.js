require('./index.js');

module.exports = {
  name: 'docker',
  deviceId: process.env['MATRIX_DEVICE_ID'],
  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
  url: {
    api: process.env['MATRIX_API_SERVER'],
    streaming: mxss:80
  },
  debug: process.env['DEBUG']
}
