module.exports = {
  name: 'production',
  url: {
    api: 'https://api.admobilize.com',
    streaming: 'http://mxss.admobilize.com'
  },
  debug: false,

  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
}