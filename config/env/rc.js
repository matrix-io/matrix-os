module.exports = {
  name: 'rc',
  url: {
    api: 'http://api.admobilize.com',
    streaming: 'http://rc-mxss.admobilize.com'
  },
  debug: false,
  deviceSecret: process.env['MATRIX_DEVICE_SECRET']
}
