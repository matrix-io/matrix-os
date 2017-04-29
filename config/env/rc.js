module.exports = {
  name: 'rc',
  url: {
    api: 'https://rc-api.admobilize.com',
    streaming: 'http://mxss.admobilize.com'
  },
  debug: false,
  deviceSecret: process.env['MATRIX_DEVICE_SECRET']
}