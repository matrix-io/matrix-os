module.exports = {
  name: 'dev',
  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
  url: {
    api: 'http://dev-demo.admobilize.com',
    streaming: 'http://104.196.123.3:80'
  },
  debug: true
}
