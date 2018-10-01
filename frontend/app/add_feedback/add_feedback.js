'use strict';

angular.module('feedbackApp.addFeedback', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/addFeedback', {
  templateUrl: '/add_feedback/add_feedback.html',
  controller: 'addFeedbackController'
  });
}])
.controller('addFeedbackController', function($scope, UserSettings, Feedback) {
  $scope.buttonDisabled = false;
  $scope.status = '';

  UserSettings.get_auth().then((auth) => {
    $scope.auth = auth;
  }, (error) => {
    $scope.status = `Could not fetch auth data: ${error}`;
    $scope.buttonDisabled = true;
  });

  $scope.form = {
    score: 5,
    statement: ''
  };

  $scope.submit = () => {
  $scope.status = 'Uploading...';
  $scope.buttonDisabled = true;

  Feedback.add_feedback($scope.form.statement, $scope.form.score).then(() => {
    $scope.status = 'Success!';
  }, (error) => {
    $scope.status = `Error: ${error}`;
    $scope.buttonDisabled = false;
  });
  };
});
