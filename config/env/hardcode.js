module.exports = {
  name: 'hardcode',
  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
  url: {
    api: 'https://dev-api.admobilize.com',
    streaming: 'http://104.197.139.81'
  },
  debug: true
}