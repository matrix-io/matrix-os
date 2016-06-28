require('./index.js');

module.exports = {
  name: 'docker',
  url: {
    api: process.env['MATRIX_API_SERVER'],
    streaming: process.env['MATRIX_STREAMING_SERVER']
  },
  debug: process.env['DEBUG']
}
