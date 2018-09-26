'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('feedbackApp', [
  'ngRoute',
  'feedbackApp.home',
])
.config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider.otherwise({redirectTo: '/home'});
}]);
