'use strict';

angular.module('feedbackApp.setUser', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/setUser', {
  templateUrl: '/set_user/set_user.html',
  controller: 'setUserController'
  });
}])
.service('UserSettings', function($q, $window) {
  this.get_auth = function() {
    let defer = $q.defer();

    let user = $window.localStorage.getItem('user');
    let productManager = $window.localStorage.getItem('productManager');
    let auth = {
      user: user === undefined ? '' : user,
      productManager: productManager === undefined ? false : (productManager === 'true')
    };

    defer.resolve(auth);

    return defer.promise;
  };

  this.set_auth = function(auth) {
    $window.localStorage.setItem('user', auth.user);
    $window.localStorage.setItem('productManager', auth.productManager);
  };
})
.controller('setUserController', function($scope, UserSettings) {
  $scope.errorMessage = '';

  UserSettings.get_auth().then((auth) => {
    $scope.auth = auth;
  }, (error) => {
    $scope.errorMessage = `Could not fetch auth data: ${error}`;
  });

  $scope.change = () => {
    UserSettings.set_auth($scope.auth);
  };
});
