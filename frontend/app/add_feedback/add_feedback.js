'use strict';

angular.module('feedbackApp.addFeedback', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/addFeedback', {
    templateUrl: '/add_feedback/add_feedback.html',
    controller: 'addFeedbackController'
  });
}])
.controller('addFeedbackController', function($scope, $http, $window) {
  $scope.buttonDisabled = false;
  $scope.status = '';
  $scope.loggedIn = window.localStorage.getItem('user') !== undefined;

  $scope.form = {
    score: 5,
    statement: ''
  };

  $scope.submit = () => {
    $scope.status = 'Uploading...';
    $scope.buttonDisabled = true;

    let data = {
      score: $scope.form.score,
      statement: $scope.form.statement,
      user: $window.localStorage.getItem('user'),
    };
    console.log($scope.form);
    $http.post('http://127.0.0.1:8001/feedback/post', data, {}).then((response) => {
      $scope.status = 'Success!';
    }, (response) => {
      $scope.status = `Error: ${response.data.error === undefined ? 'Unknown error' : response.data.error}`;
      $scope.buttonDisabled = false;
    });
  };
});
