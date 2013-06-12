'use strict';

angular.module('app', ['ui.bootstrap', 'api.bountysource', 'ngSanitize'])
  .config(function ($routeProvider, $locationProvider, $provide) {

    //  NOTE: uncomment to test hashbang # mode
    //  $provide.decorator('$sniffer', function($delegate) { $delegate.history = false; return $delegate; });

    $locationProvider.html5Mode(true);
    $routeProvider.otherwise({ templateUrl: 'pages/layout/not_found.html' });
  });
