module.exports = {
    registerDevice: function(cb) {

      var url = config.url.device.register;

      if (Matrix.activeUser) {
        require('getmac').getMac(function(err, macAddress) {
          if (err) cb(new Error(err));

          Matrix.activeDevice.deviceId = macAddress;

          params = {
            device_id: Matrix.activeDevice.deviceId,
            access_token: Matrix.activeClient.accessToken,
            name: Matrix.activeDevice.name,
            description: Matrix.activeDevice.description
          };

          Matrix.service.post({ url: url, form: params }, function(err, response ){
            if (err) return cb(err);
            Matrix.activeDevice.deviceToken = response.results.device_token
            cb(null, responseJSON);
          });
        });
      } else {
        cb(new Error("This device is not associated to an user"));
      }
    },

    /*
     *@method  registerAnonymousDevice
     *@param  {Client} client
     *@param  {Devicie} device
     */

    registerAnonymousDevice: function(device, client, callback) {
      var url = config.url.device.registerAnonymous;

      require('getmac').getMac(function(err, macAddress) {
        if (err) throw err;

        Matrix.activeDevice.deviceId = macAddress;

        params = {
          device_id: device.getDeviceId(),
          client_token: client.getAccessToken(),
          name: device.getName(),
          description: device.getDescription()
        };

        request.post({
          url: url,
          form: params
        }, function(error, response, body) {

          if (error) {
            callback(new Error('Server not responding'), {});
            return;
          }
          var responseJSON = JSON.parse(body);
          if (responseJSON.status === 'OK') {
            device.setDeviceToken(responseJSON.results['device_token']);
            callback(null, responseJSON);
          } else {

            callback(new Error('Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);


          }

        });
      });
    },

    retrieveDeviceToken: function(device, client) {

      var url = config.settings.apiHost + config.settings.retriveDeviceToken;

      params = {
        device_id: device.getDeviceId(),
        client_token: client.getAccessToken(),
      };

      request.post({
        url: url,
        form: params
      }, function(error, response, body) {

        if (error) {
          callback(new Error('Server not responding'), {});
          return;
        }

        var responseJSON;

        try {
          responseJSON = JSON.parse(body);
        } catch (error) {
          callback(new Error("Error " + response.status))
        }

        if (responseJSON.status === 'OK') {
          device.setDeviceToken(responseJSON.results['device_token']);
          callback(null, responseJSON);
        } else {

          callback(new Error('Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);

        }

      });
    },


    /**
     * @method authenticateClient
     * @description Make sure the application is authorized on load to create registrations, using the client_id ,client_secret  and grant_type parameters
     * @param {Object} client
     * @param {Function} callback(error,responseJSON)
     */
    authenticateClient: function(client, callback) {

      var url = config.settings.apiHost + config.settings.authClientPath;
      var params = {
        client_id: client.getClientId(),
        client_secret: client.getClientSecret(),
        grant_type: "client_credentials"
      };

      request.post({
        url: url,
        form: params
      }, function(error, response, body) {

        if (error) {
          callback(new Error('Server not responding'), {});
          return;
        }

        try {
          var responseJSON = JSON.parse(body);
        } catch (error) {
          callback(new Error('Server not responding'), null);
        }
        if (responseJSON.status == 'OK') {

          client.setAccessClientCredentialsToken(responseJSON.results);
          callback();
        } else {
          console.log('body response ' + body);
          callback(new Error(' Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);
        }

      });
    },

    /**
     * @method authenticateUser
     * @description Authenticate a registered user
     * @param {Object} client
     * @param {Object} user
     * @param {Function} callback(error, responseJSON)
     */
    authenticateUser: function(user, callback) {

      var url = config.settings.apiHost + config.settings.authUserPath;

      form = {
        client_id: user.getClient().getClientId(),
        client_secret: user.getClient().getClientSecret(),
        username: user.getUsername(),
        password: user.getPassword(),
        grant_type: 'password'
      }

      request.post({
        url: url,
        form: form
      }, function(error, response, body) {

        if (error) {
          callback(new Error('Server not responding'), {});
          return;
        }

        var responseJSON = JSON.parse(body);

        if (responseJSON.status === 'OK') {
          user.setAccessUserCredentialsToken(responseJSON.results);
          callback();
        } else {
          callback(new Error(' Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);
        }

      });

    },

    /**
     * @method refreshUserToken
     * @description Refresh the user's token
     * @param {User} user
     * @param {Function} callback(error, responseJSON)
     */
    refreshUserToken: function(user, callback) {

        console.log("resfresh token to user " + user.getUsername());
        var url = config.settings.apiHost + config.settings.refreshUserTokenPath;

        form = {
          client_id: user.getClient().getClientId(),
          client_secret: user.getClient().getClientSecret(),
          access_token: user.getAccessToken(),
          grant_type: "refresh_token"
        }

        request.post({
              url: url,
              form: form
            }, function(error, response, body) {

              if (error) {
                callback(new Error('Server not responding'), {});
                console.log("server not responding " + error);
                return;
              }

              var responseJSON = JSON.parse(body);

              if (responseJSON.status === 'OK') {
                user.setAccessUserCredentialsToken(responseJSON.results);
                callback();
              } else {
                callback(new Error(' Error ' + responseJSON.status_code + ' ' + responseJSON.error), responseJSON);
              }
            });
      }
    }
