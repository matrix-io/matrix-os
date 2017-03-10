module.exports = {
  name: 'rc',
  url: {
    api: 'http://rc-api.admobilize.com',
    streaming: 'http://stage-mxss.admobilize.com'
  },
  debug: false,
  deviceSecret: process.env['MATRIX_DEVICE_SECRET']
}