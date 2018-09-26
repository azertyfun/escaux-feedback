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
    let productManager = $window.localStorage.getItem('productManager');
    $scope.auth = {
        user: user === undefined ? '' : user,
        productManager: productManager === undefined ? false : (productManager === 'true')
    };

    $scope.change = () => {
        $window.localStorage.setItem('user', $scope.auth.user);
        $window.localStorage.setItem('productManager', $scope.auth.productManager);
    };
});
