'use strict';

angular.module('feedbackApp.comments', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/comments', {
    templateUrl: '/comments/comments.html',
    controller: 'commentsController'
  });
}])
.controller('commentsController', function($scope, $http, $location, $window) {
  $scope.comments = [];
  $scope.loggedIn = window.localStorage.getItem('user') !== undefined;

  let id = $location.search().id;

  $http.get(`http://127.0.0.1:8001/feedback/${id}/comments`).then((response) => {
    $scope.comment = {
      id: id
    };
    $scope.comments = response.data.comments
    $scope.comments.forEach(comment => {
      comment.reply = {
        show: false,
        text: '',
        status: '',
        buttonDisabled: false
      };
    });
  }, (response) => {
    console.error(`Could not fetch /feedback/${id}/comments: ${response}`);
    console.log(response);
  });

  $scope.submit = (comment) => {
    comment.reply.buttonDisabled = true;
    let data = {
      statement: comment.reply.text,
      user: $window.localStorage.getItem('user'),
    };
    $http.post(`http://127.0.0.1:8001/feedback/${comment.id}/post`, data, {}).then((response) => {
      comment.reply.status = 'Success!';
    }, (response) => {
      comment.reply.status = `Error: ${response.data.error === undefined ? 'Unknown error' : response.data.error}`;
      comment.reply.buttonDisabled = false;
    });
  };
});
