module.exports = {
  name: 'stage',
  url: {
    api: 'http://stage-demo.admobilize.com',
    streaming: 'http://stage-mxss.admobilize.com:80'
  },
  debug: false,

  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
}
