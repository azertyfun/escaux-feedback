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
  $scope.productManager = $window.localStorage.getItem('productManager');
  $scope.feedback = [];

  $http.get('http://127.0.0.1:8001/feedback').then((response) => {
    $scope.feedback = response.data.feedback

    $scope.feedback.forEach(message => {
      message.vote = {
        status: ''
      };
      message.merge = {
        status: ''
      };
      message.newStatus = {
        value: 0,
        buttonDisabled: false,
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
    });
  };

  $scope.merge = (message) => {
    let orig = message.id;
    let dest = prompt('Destination?');
    if (dest === null)
      return;

    if (dest[0] === '#') {
      dest = dest.substring(1);
    }

    message.merge.status = 'Merge uploading...';

    let data = {
      user: $window.localStorage.getItem('user')
    };

    $http.post(`http://127.0.0.1:8001/feedback/${orig}/merge/${dest}`, data, {}).then((response) => {
      message.merge.status = 'Merge successful!';
    }, (response) => {
      message.merge.status = `Merge error: ${response.data.error === undefined ? 'Unknown error' : response.data.error}`;
    });
  }

  $scope.status = (message) => {
    switch(message.status) {
      case 0:
        return 'None';
      case 1:
        return 'Open';
      case 2:
        return 'Closed (Backlog)';
      case 3:
        return 'Closed (Solved)';
      case 4:
        return 'Closed (Rejected)';
    }
  };

  $scope.setStatus = (message) => {
    message.newStatus.status = 'Status change uploading...';
    message.newStatus.buttonDisabled = true;

    let data = {
      user: $window.localStorage.getItem('user'),
      status: parseInt(message.newStatus.value)
    };

    $http.post(`http://127.0.0.1:8001/feedback/${message.id}/status`, data, {}).then((response) => {
      message.newStatus.status = 'Status change successful!';
    }, (response) => {
      message.newStatus.status = `Status change error: ${response.data.error === undefined ? 'Unknown error' : response.data.error}`;
      message.newStatus.buttonDisabled = false;
    });
  }
});
