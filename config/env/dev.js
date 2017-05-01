module.exports = {
  name: 'dev',

  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
  url: {
    api: 'https://dev-api.admobilize.com',
    streaming: 'http://dev-mxss.admobilize.com'
  },
  debug: true
}