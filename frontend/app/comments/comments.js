'use strict';

angular.module('feedbackApp.comments', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/comments', {
    templateUrl: '/comments/comments.html',
    controller: 'commentsController'
  });
}])
.controller('commentsController', function($scope, $http, $location) {
  $scope.comments = [];

  let id = $location.search().id;

  $http.get(`http://127.0.0.1:8001/feedback/${id}/comments`).then((response) => {
    $scope.comments = response.data.comments
  }, (response) => {
    console.error(`Could not fetch /feedback/${id}/comments: ${response}`);
    console.log(response);
  });
});
