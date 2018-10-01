'use strict';

angular.module('feedbackApp.comments', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/comments', {
    templateUrl: '/comments/comments.html',
    controller: 'commentsController'
  });
}])
.service('Comments', function($q, $http, UserSettings) {
  this.fetch_feedback = function(id) {
    let defer = $q.defer();

    $http.get(`http://127.0.0.1:8001/feedback/${id}`).then((response) => {
      defer.resolve(response.data);
    }, (response) => {
      defer.reject(`Could not fetch /feedback/${id}: ${response}`);
    });

    return defer.promise;
  }

  this.fetch_comments = function(id) {
    let defer = $q.defer();

    $http.get(`http://127.0.0.1:8001/feedback/${id}/comments`).then((response) => {
      let comments = response.data.comments;
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
      comments.forEach(comment => {
        addFields(comment);
      });

      defer.resolve(comments);
    }, (response) => {
      defer.reject(`Could not fetch /feedback/${id}/comments: ${response}`)
    });

    return defer.promise;
  };

  this.add_comment = function(parent, statement) {
    let defer = $q.defer();

    UserSettings.get_auth().then((auth) => {
      let data = {
        user: auth.user,
        statement: statement
      };

      $http.post(`http://127.0.0.1:8001/feedback/${parent}/post`, data, {}).then((response) => {
        defer.resolve();
      }, (response) => {
        defer.reject(response.data.error === undefined ? 'Unknown error' : response.data.error);
      });
    }, (error) => {
      defer.reject(`Could not authenticate user: ${error}`);
    });

    return defer.promise;
  }

})
.controller('commentsController', function($scope, $location, Comments, UserSettings, Feedback) {
  $scope.errorMessage = '';

  UserSettings.get_auth().then((auth) => {
      $scope.auth = auth;
  }, (error) => {
    $scope.errorMessage = `Could not fetch auth data: ${error}`;
  });

  $scope.comments = [];
  $scope.feedback = {};

  let id = $location.search().id;

  Comments.fetch_feedback(id).then((feedback) => {
      $scope.feedback = feedback;
  }, (error) => {
    $scope.errorMessage += `\nCould not fetch feedback: ${error}`;
  });

  $scope.comment = {
    id: id
  };

  Comments.fetch_comments(id).then((comments) => {
    $scope.comments = comments;
  }, (error) => {
    $scope.errorMessage += `\nCould not fetch comments: ${error}`;
  })

  $scope.submit = (comment) => {
    comment.reply.buttonDisabled = true;
    comment.reply.status = 'Uploading...';

    Comments.add_comment(comment.id, comment.reply.text).then(() => {
      comment.reply.status = 'Success!';
    }, (error) => {
      comment.reply.status = `Error: ${error}`;
      comment.reply.buttonDisabled = false;
    })
  };

  $scope.vote = (comment, vote) => {
    comment.vote.status = 'Voting...';

    Feedback.vote(comment.id, vote).then(() => {
      comment.vote.status = 'Success!';
    }, (error) => {
      `Could not vote: ${error}`;
    })
  };
});
