require('./index.js');

module.exports = {
  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
  name: 'device',
  url: {
    api: 'http://dev-demo.admobilize.com',
    streaming: 'http://home:3000'
  },
  debug: true
}
