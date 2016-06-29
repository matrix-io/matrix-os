module.exports = {
  name: 'dev',

  deviceSecret: process.env['MATRIX_DEVICE_SECRET'],
  url: {
    api: 'http://dev-demo.admobilize.com',
    streaming: 'http://dev-mxss.admobilize.com:80'
  },
  debug: true
}
