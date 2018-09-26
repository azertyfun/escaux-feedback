'use strict';

angular.module('feedbackApp.home', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: '/home/home.html',
    controller: 'homeController'
  });
}])
.controller('homeController', function($scope, $http) {
  $scope.feedback = [];
  $http.get('http://127.0.0.1:8001/feedback').then((response) => {
    $scope.feedback = response.data.feedback
  }, (response) => {
    console.error(`Could not fetch /feedback: ${response}`);
  });
});
