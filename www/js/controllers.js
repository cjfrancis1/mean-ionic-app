var openInAppBrowser = function(url) {
  window.open(url, '_blank');
};

angular.module('controllers', [])

    .controller('MainCtrl', ['$scope', '$localStorage', 'Auth',
      function ($scope, $localStorage, Auth) {
        $scope.data = {userId: undefined};

        $scope.init = function () {

        };
        //$scope.init();
  
        $scope.logOut = function () {
          delete $localStorage.token;
          window.location = '/#/index';
        };

    }])

    .controller('HomeCtrl', ['$scope', function ($scope) {

    }])

    .controller('UserProfileCtrl', ['$scope', '$stateParams', 'Users', function($scope, $stateParams, Users) {
      Users.get({userId: $stateParams.userId}).$promise.then(function (data) {
        $scope.user = data.response;
      });

      $scope.openInAppBrowser = openInAppBrowser;
    }])

    .controller('LogInCtrl', ['$scope', '$rootScope', '$localStorage', '$state', '$ionicHistory', 'Authenticate', 'Auth', function ($scope, $rootScope, $localStorage, $state, $ionicHistory, Authenticate, Auth) {
      $scope.data = { email: '', password: ''};
      $scope.alerts = {errors: []};

      $scope.logIn = function () {
        if ($scope.data.email && $scope.data.password) {
          Authenticate.save({email: $scope.data.email, password: $scope.data.password}).$promise.then(function (data) {
            if (data && data.status) {
              if (data.status === 200 && data.response) {
                $localStorage.token = data.response;
                $ionicHistory.nextViewOptions({
                  historyRoot: true
                });
                $rootScope.userId = Auth.getTokenClaims($localStorage.token).id;
                $state.go('members/home');
                $scope.data = { email: '', password: ''};
              } else if (data.errors) {
                $scope.alerts.errors = ['The Email / Password combination that you entered does not match our records, or your account is still awaiting approval.'];
              }
            }
          });
        } else {
          $scope.alerts.errors = [];
          if (!$scope.data.email) {
            $scope.alerts.errors.push('Please enter a valid EMAIL address.');
          }
          if (!$scope.data.password) {
            $scope.alerts.errors.push('Please enter a valid PASSWORD.');
          }
        }
      };

    }])

    .controller('RegisterCtrl', ['$scope', '$localStorage', 'Auth', function ($scope, $localStorage, Auth) {

      function clearForm() {
        $scope.data = {
          first_name: null,
          last_name: null,
          email: null,
          password: null,
          confirm_password: null,
          twitter_handle: null
        };
        return false;
      }

      clearForm();

      $scope.register = function() {
        var isPopulatedBool = true;
        $scope.alerts = {
          errors: [],
          success: []
        };

        for (var field in $scope.data) {
          if (!$scope.data[field]) {
            isPopulatedBool = false;
            if (field === 'confirm_password') {
              $scope.alerts.errors.push('Please confirm your password.')
            } else {
              $scope.alerts.errors.push('Please enter a valid '+field.replace('_', ' ').toUpperCase()+'.');
            }
          }
        }
        if (!isPopulatedBool) {
          return false;
        } else {
          if ($scope.data.confirm_password !== $scope.data.password) {
            return $scope.alerts.errors = ['The values for PASSWORD and CONFIRM PASSWORD do not match.'];
          }
          Auth.register({
            firstName: $scope.data.first_name,
            lastName: $scope.data.last_name,
            email: $scope.data.email,
            password: $scope.data.password,
            twitterHandle: $scope.data.twitter_handle
          }).then(function (obj) {
            if (obj.data) {
              var data = obj.data;
              if (!data.status || data.status !== 200 && data.errors && data.errors.length) {
                return $scope.alerts.errors = data.errors;
              } else if (data.response && data.response.success) {
                $scope.alerts.success = ['You were successfully registered as a user. Please allow 2-3 business days for us to review your info and activate your account. In the meantime, please check your email for an email verification link; you will not be able to log in once approved unless your email address has been verified.'];
                return clearForm();
              }
            }
          });
        }
      };

    }])

    .controller('ForgotPasswordCtrl', ['$scope', 'Auth', function ($scope, Auth) {

      function clearForm() {
        $scope.data = {
          email: null
        };
        return false;
      }

      clearForm();

      $scope.resetPassword = function () {
        var isPopulatedBool = true;
        $scope.alerts = {
          errors: [],
          success: []
        };

        if (!$scope.data.email) {
          isPopulatedBool = false;
          $scope.alerts.errors.push('Please enter a valid EMAIL address.');
        }
        if (!isPopulatedBool) {
          return false;
        } else {
          Auth.resetPassword($scope.data).then(function (obj) {
            if (obj.data) {
              var data = obj.data;
              if (data.status) {
                $scope.alerts.success = ['If the email address that you provided belongs to an active user, instructions to reset your password were sent to the provided email address.'];
                return clearForm();
              }
            }
          });
        }
      }

    }])

    .controller('EmailVerificationCtrl', ['$scope', 'Auth', function ($scope, Auth) {

      function clearForm() {
        $scope.data = {
          email: null
        };
        return false;
      }

      clearForm();

      $scope.sendVerificationEmail = function () {
        var isPopulatedBool = true;
        $scope.alerts = {
          errors: [],
          success: []
        };

        if (!$scope.data.email) {
          isPopulatedBool = false;
          $scope.alerts.errors.push('Please enter a valid EMAIL address.');
        }
        if (!isPopulatedBool) {
          return false;
        } else {
          Auth.sendVerificationEmail($scope.data).then(function (obj) {
            if (obj.data) {
              var data = obj.data;
              if (data.status) {
                $scope.alerts.success = ['An email verification link has been resent to the provided email address.'];
                return clearForm();
              }
            }
          });
        }
      }

    }]);

