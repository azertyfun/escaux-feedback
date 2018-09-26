'use strict';

angular.module('feedbackApp.setUser', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/setUser', {
    templateUrl: '/set_user/set_user.html',
    controller: 'setUserController'
  });
}])
.controller('setUserController', function($scope, $window) {
    let user = $window.localStorage.getItem('user');
    $scope.user = user === undefined ? '' : user;
    $scope.change = () => {
        $window.localStorage.setItem('user', $scope.user)
    };
});
