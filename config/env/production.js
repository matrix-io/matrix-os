module.exports = {
  name: 'production',
  url: {
    api: 'https://api.admobilize.com',
    streaming: 'http://mxss.admobilize.com:80'
  },
  debug: false,

  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
}