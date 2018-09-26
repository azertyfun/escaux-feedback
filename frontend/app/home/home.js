'use strict';

angular.module('feedbackApp.home', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: '/home/home.html',
    controller: 'homeController'
  });
}])
.controller('homeController', function($scope) {
  $scope.feedback = [
    {
      "user": "nathan",
      "statement": "Great app!",
      "score": 5,
      "status": 0,
      "votes": -1
    },
    {
      "user": "nathan",
      "statement": "eh",
      "score": 3,
      "status": 0,
      "votes": 0
    }
  ]
});