// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('ionic-project', ['ionic', 'ngStorage', 'services', 'controllers'])

    .run(['$ionicPlatform', '$rootScope', '$localStorage', 'Users', 'Auth',
      function ($ionicPlatform, $rootScope, $localStorage, Users, Auth) {
      $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.cordova && window.cordova.inAppBrowser) {
          window.open = cordova.InAppBrowser.open;
        }
        if (window.StatusBar) {
          // org.apache.cordova.statusbar required
          StatusBar.styleDefault();
        }

        $rootScope.$on('$stateChangeStart', function (event, toState, toStateParams, fromState, fromStateParams) {

          //if(toState.name.indexOf('log-in') !== -1) {
          //  if ($localStorage.token) {
          //    event.preventDefault();
          //    window.location = '/';
          //    return false;
          //  }
          //}
          //
          //if(toState.name.indexOf('members') !== -1) {
          //  if (!Auth.isAuth()) {
          //    event.preventDefault();
          //    window.location = '/#/log-in';
          //  }
          //} //if members/state

          switch (toState.name) {
            case 'index':
            case 'log-in':
            case 'register':
            case 'forgot-password':
              if ($localStorage.token) {
                window.location = '/';
                return false;
              }
              break;
          }

          if(toState.name.indexOf('members') !== -1) {

            var indexView = '/#/index';

            if ($localStorage.token) {

              var userId = Auth.getTokenClaims($localStorage.token).id;

              Users.get({userId: userId}).$promise.then(function (data) {

                if (data.status && data.status === 200) {

                  var user = data.response || null;

                  if (user && user.status === 'active') {
                    return true;
                  } else {
                    delete $localStorage.token;
                    event.preventDefault();
                    window.location = indexView;
                  }
                } else {
                  delete $localStorage.token;
                  event.preventDefault();
                  window.location = indexView;
                }
              });
            } else {
              event.preventDefault();
              window.location = indexView;
            }
          } //if members/state

        });
      });
    }])

    .config(['$stateProvider', '$urlRouterProvider', '$httpProvider',
      function ($stateProvider, $urlRouterProvider, $httpProvider) {

      $stateProvider

          .state('index', {
            url: '/index',
            templateUrl: 'templates/index.html'
          })

          .state('log-in', {
            url: '/log-in',
            templateUrl: 'templates/log-in.html',
            controller: 'LogInCtrl'
          })

          .state('register', {
            url: '/register',
            templateUrl: 'templates/register.html'
          })

          .state('forgot-password', {
            url: '/forgot-password',
            templateUrl: 'templates/forgot-password.html',
            controller: 'ForgotPasswordCtrl'
          })

          .state('members/home', {
            url: '/home',
            templateUrl: 'templates/home.html',
            controller: 'HomeCtrl'
          })

          .state('members/user-profile', {
            url: '/user-profile/:userId',
            templateUrl: 'templates/user-profile.html',
            controller: 'UserProfileCtrl'
          });

      $urlRouterProvider.otherwise(function ($injector, $location) {
        var $localStorage = $injector.get('$localStorage'),
            Auth = $injector.get('Auth'),
            $state = $injector.get('$state');

        //if (Auth.isAuth()) {
        if (typeof $localStorage.token !== 'string') {
          $state.go('index');
        } else {
          $state.go('members/home');
        }
      });

      $httpProvider.interceptors.push(['$q', '$location', '$localStorage', function ($q, $location, $localStorage) {
        return {
          'request': function (config) {
            config.headers = config.headers || {};
            if ($localStorage.token) {
              config.headers.Authorization = 'Bearer ' + $localStorage.token;
            }
            return config;
          }
          //},
          //'responseError': function (response) {
          //  if (response.status === 401 || response.status === 403) {
          //    $location.path('/#/index');
          //  }
          //  console.log('response Error');
          //  return $q.reject(response);
          //}
        };
      }]);

    }])

    .filter('capitalize', function() {
      return function(input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
      }
    });
