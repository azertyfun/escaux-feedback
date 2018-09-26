'use strict';

angular.module('feedbackApp.home', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: '/home/home.html',
    controller: 'homeController'
  });
}])
.controller('homeController', function($scope, $http, $window) {
  $scope.loggedIn = window.localStorage.getItem('user') !== undefined;
  $scope.feedback = [];

  $http.get('http://127.0.0.1:8001/feedback').then((response) => {
    $scope.feedback = response.data.feedback

    $scope.feedback.forEach(message => {
      message.vote = {
        status: ''
      };
    });
  }, (response) => {
    console.error(`Could not fetch /feedback: ${response}`);
  });

  $scope.vote = (message, vote) => {
    message.vote.status = 'Voting...';

    let data = {
      user: $window.localStorage.getItem('user'),
      vote: vote
    };

    $http.post(`http://127.0.0.1:8001/feedback/${message.id}/vote`, data, {}).then((response) => {
      message.vote.status = 'Success!';
    }, (response) => {
      message.vote.status = `Error: ${response.data.error === undefined ? 'Unknown error' : response.data.error}`;
      message.buttonDisabled = false;
    });
  };
});
