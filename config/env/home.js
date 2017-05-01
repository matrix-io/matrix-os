require('./index.js');

module.exports = {
  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
  name: 'local',
  url: {
    api: 'https://dev-api.admobilize.com',
    streaming: 'http://192.168.0.3:3000'
  },
  debug: true
}