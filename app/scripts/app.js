'use strict';

angular.module('NGi18nTestApp', ['I18nAngular'])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/home', {
                templateUrl: 'views/home.html',
                controller: 'I18nCtrl'
            })
            .when('/format', {
                templateUrl: 'views/format.html',
                controller: 'I18nCtrl'
            })
            .otherwise({
                redirectTo: '/home'
            });
    });
