require('./index.js');

module.exports = {
  name: 'docker',
  deviceId: process.env['MATRIX_DEVICE_ID'], 
  deviceSecret: process.env['MATRIX_DEVICE_SECRET'], 
  url: {
    api: process.env['MATRIX_API_SERVER'],
    streaming: process.env['MATRIX_STREAMING_SERVER']
  },
  debug: process.env['DEBUG']
}
