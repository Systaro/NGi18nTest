'use strict';

var app = angular.module('NGi18nTestApp', ['pascalprecht.translate']);

app.config(function ($routeProvider) {
        $routeProvider
            .when('/home', {
                templateUrl: 'views/home.html'
            })
            .when('/format', {
                templateUrl: 'views/format.html'
            })
            .otherwise({
                redirectTo: '/home'
            });
    });
