require('./index.js');

module.exports = {
  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
  name: 'device',
  url: {
    api: 'https://dev-api.admobilize.com',
    streaming: 'http://home:3000'
  },
  debug: true
}