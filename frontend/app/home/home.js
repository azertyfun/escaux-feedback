'use strict';


angular.module('feedbackApp.home', ['ngRoute'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/home', {
    templateUrl: '/home/home.html',
    controller: 'homeController'
  });
}])
.service('Feedback', function($q, $http, UserSettings) {
  this.fetch = function() {
    let defer = $q.defer();
    let feedback = {};
    
    $http.get('http://127.0.0.1:8001/feedback').then((response) => {
    feedback = response.data.feedback;
    
    feedback.forEach(message => {
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
    
    defer.resolve(feedback);
  }, (response) => {
    defer.reject(`HTTP Error`);
  });
  
  return defer.promise;
};

this.merge = function(orig, dest) {
  let defer = $q.defer();
  
  UserSettings.get_auth().then((auth) => {
    let data = {
      user: auth.user
    };
    
    $http.post(`http://127.0.0.1:8001/feedback/${orig}/merge/${dest}`, data, {}).then((response) => {
    defer.resolve();
  }, (response) => {
    defer.reject(response.data.error === undefined ? 'Unknown error' : response.data.error);
  });
}, (error) => {
  defer.reject(`Could not authenticate user: ${error}`);
});

return defer.promise;
};

this.set_status = function(feedback, status) {
  let defer = $q.defer();
  
  UserSettings.get_auth().then((auth) => {
    let data = {
      user: auth.user,
      status: status
    };
    
    $http.post(`http://127.0.0.1:8001/feedback/${feedback}/status`, data, {}).then((response) => {
    defer.resolve();
  }, (response) => {
    defer.reject(response.data.error === undefined ? 'Unknown error' : response.data.error);
  });
}, (error) => {
  defer.reject(`Could not authenticate user: ${error}`);
});

return defer.promise;
};

this.vote = function(feedback, vote) {
  let defer = $q.defer();
  
  UserSettings.get_auth().then((auth) => {
    let data = {
      user: auth.user,
      vote: vote
    };
    
    $http.post(`http://127.0.0.1:8001/feedback/${feedback}/vote`, data, {}).then((response) => {
    defer.resolve();
  }, (response) => {
    defer.reject(response.data.error === undefined ? 'Unknown error' : response.data.error);
  });
}, (error) => {
  defer.reject(`Could not authenticate user: ${error}`);
});

return defer.promise;
}

this.add_feedback = function(statement, score) {
  let defer = $q.defer();
  
  UserSettings.get_auth().then((auth) => {
    let data = {
      user: auth.user,
      statement: statement,
      score: score
    };
    
    $http.post(`http://127.0.0.1:8001/feedback/post`, data, {}).then((response) => {
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
.controller('homeController', function($scope, Feedback, UserSettings) {
  $scope.feedback = [];
  $scope.errorMessage = '';
  
  UserSettings.get_auth().then((auth) => {
    $scope.auth = auth;
  }, (error) => {
    $scope.errorMessage = `Could not fetch auth data: ${error}`;
  });
  
  Feedback.fetch().then((feedback) => {
    $scope.feedback = feedback;
  }, (error) => {
    $scope.errorMessage += `\nCould not fetch feedback: ${error}`;
  });
  
  $scope.vote = (message, vote) => {
    message.vote.status = 'Voting...';
    
    Feedback.vote(message.id, vote).then(() => {
      message.vote.status = 'Success!';
    }, (error) => {
      `Could not vote: ${error}`;
    })
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
    
    Feedback.merge(orig, dest).then((response) => {
      message.merge.status = 'Merge successful!';
    }, (error) => {
      message.merge.status = `Merge unsuccessful: ${error}`;
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
  
  $scope.set_status = (message) => {
    message.newStatus.status = 'Status change uploading...';
    message.newStatus.buttonDisabled = true;
    
    Feedback.set_status(message.id, parseInt(message.newStatus.value)).then(() => {
      message.newStatus.status = 'Status changed!';
    }, (error) => {
      message.newStatus.status = `Could not change status: ${error}`;
      message.newStatus.buttonDisabled = false;
    });
  }
});
