module.exports = {
  name: 'production',
  url: {
    api: 'https://api.admobilize.com',
    streaming: 'https://mxss.admobilize.com'
  },
  debug: false,

  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
}