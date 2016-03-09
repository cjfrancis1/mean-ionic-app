var config = {
  'api_localhost': 'http://localhost:5000/',
  'api_ip': 'http://10.0.0.10:5000/'
};

angular.module('services', ['ngResource'])

    .factory('Users', ['$resource', function ($resource) {
      return $resource(config.api_localhost+'api/users/:userId');
    }])

    .factory('Authenticate',['$resource', function ($resource) {
      return $resource(config.api_localhost+'authenticate');
    }])

    .factory('Auth', ['$http', '$localStorage', function ($http, $localStorage) {
      function urlBase64Decode(str) {
        var output = str.replace('-', '+').replace('_', '/');
        switch (output.length % 4) {
          case 0:
            break;
          case 2:
            output += '==';
            break;
          case 3:
            output += '=';
            break;
          default:
            throw 'Illegal base64url string!';
        }
        return window.atob(output);
      }

      function getClaimsFromToken(token) {
        //var token = $localStorage.token;
        var user = {};
        if (typeof token !== 'undefined') {
          var encoded = token.split('.')[1];
          user = JSON.parse(urlBase64Decode(encoded));
        }
        return user;
      }

      //var tokenClaims = getClaimsFromToken();

      function isAuth() {
        var isAuthBool = false;

        if ($localStorage.token) {

          var userId = getClaimsFromToken().id;

          console.log('working: line 53');
          $http.get(config.api_localhost+'api/users/'+userId).then(function (data) {
            if (data.status && data.status === 200) {

              var user = data.response || null;

              if (user && user.status === 'active') {
                return isAuthBool = true;
              }
            } //if data.status === 200
            console.log('working: line 63');
            return delete $localStorage.token;
          });

          console.log('working: line 66');

          //var $injector = angular.injector(),
          //    Users = $injector.get('Users');
          //
          //Users.get({userId: userId}).$promise.then(function (data) {
          //
          //  if (data.status && data.status === 200) {
          //
          //    var user = data.response || null;
          //
          //    if (user && user.status === 'active') {
          //      return isAuthBool = true;
          //    }
          //    return delete $localStorage.token;
          //  } //if data.status === 200
          //});
        }
        console.log('working: line 83');
        console.log(isAuthBool);
        return isAuthBool;
      }

      function register(data) {
        return $http.post(config.api_localhost+'register_user', data);
      }

      function resetPassword(data) {
        return $http.post(config.api_localhost+'reset_password', data);
      }

      function sendVerificationEmail(data) {
        return $http.post(config.api_localhost+'send_verification_email', data);
      }

      return {
        getTokenClaims: getClaimsFromToken,
        isAuth: isAuth,
        register: register,
        resetPassword: resetPassword,
        sendVerificationEmail: sendVerificationEmail
      };
    }]);

