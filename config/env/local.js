require('./index.js');

module.exports = {

  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
  name: 'local',
  url: {
    api: 'http://dev-demo.admobilize.com',
    streaming: 'http://localhost:3000'
  },
  debug: true
}
