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
  $scope.feedback = {};
  $scope.loggedIn = window.localStorage.getItem('user') !== undefined;

  let id = $location.search().id;

  $http.get(`http://127.0.0.1:8001/feedback/${id}`).then((response) => {
    $scope.feedback = response.data;
  }, (response) => {
    console.error(`Could not fetch /feedback/${id}: ${response}`);
  });

  $http.get(`http://127.0.0.1:8001/feedback/${id}/comments`).then((response) => {
    $scope.comment = {
      id: id
    };
    $scope.comments = response.data.comments;
    let addFields = (comment) => {
      comment.reply = {
        show: false,
        text: '',
        status: '',
        buttonDisabled: false
      };
      comment.vote = {
        status: ''
      };

      comment.comments.forEach(c => {
        addFields(c);
      })
    };
    $scope.comments.forEach(comment => {
      addFields(comment);
    });
  }, (response) => {
    console.error(`Could not fetch /feedback/${id}/comments: ${response}`);
    console.log(response);
  });

  $scope.submit = (comment) => {
    comment.reply.buttonDisabled = true;
    comment.reply.status = 'Uploading...';
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

  $scope.vote = (comment, vote) => {
    comment.vote.status = 'Voting...';

    let data = {
      user: $window.localStorage.getItem('user'),
      vote: vote
    };

    $http.post(`http://127.0.0.1:8001/feedback/${comment.id}/vote`, data, {}).then((response) => {
      comment.vote.status = 'Success!';
    }, (response) => {
      comment.vote.status = `Error: ${response.data.error === undefined ? 'Unknown error' : response.data.error}`;
      comment.buttonDisabled = false;
    });
  };
});
