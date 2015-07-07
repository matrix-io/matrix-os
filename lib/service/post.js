var request = require('request');

// Handles Errors
// TODO consider making this promisable so there can be error handling
// Check for expired tokens
function post(config, cb){
  return request.post( config, function( err, response, body ){
      if (err) {
        // server error
        cb(new Error('Server unavailable'), {
          error: 'Server unavailable: ' + err
        });
      } else if (response.statusCode !== 200) {
        // service error
        var statusCode = response ? response.statusCode : '';
        cb(new Error('Error submitting data (' + statusCode + ')'), {
          error: 'Error submitting data'
        });
      } else {
        // valid response sent
        var responseJSON = JSON.parse(body);

        if ( responseJSON.status !== 'OK') {
          // payload error
          if (_.isString( responseJSON.error ))  {
            cb(new Error('Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);
          } else {
            cb(new Error('Error ' + responseJSON.status_code), responseJSON);
          }
        } else if (responseJSON.status === 'OK') {
          // success
          cb(null, responseJSON);
        }
      }
  });
}

module.exports = post;