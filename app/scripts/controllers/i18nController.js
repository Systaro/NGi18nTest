'use strict';

angular.module('NGi18nTestApp')
    .controller('I18nCtrl', function ($scope) {
        function safeApply(locale) {
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

        $scope.now = function(){
           return new Date();
        }

        $scope.customDateFormat = "{HH}:{mm}";
        $scope.customNumber = Math.random().toFixed(9) * 1000000;
        $scope.customCurrency = Math.random().toFixed(8) * 1000000;

        $scope.locales = [
            {label: 'English (United States)', code: 'en-US'},
            {label: 'Deutsch (Deutschland)', code: 'de-DE'}
        ];

        $scope.selectedLocale = findLocale(getBrowserLanguageCode());

        /**
         * Searches a available locale, if none is found the first available locale is given back
         * @param {String} code
         * @returns {Mixed} locale
         */
        function findLocale(code) {
            var returnValue = _.find($scope.locales, {'code': code});
            return (returnValue ? returnValue: $scope.locales[0]);
        }

        function getBrowserLanguageCode(){
            var language = (localStorage.getItem("i18nLanguage") || window.navigator.userLanguage || window.navigator.language);

            if (language.length == 2) {
                language = language + '-' + language.toUpperCase();
            }

            return language;
        }

        /**
         * Set the current locale
         * @param {Mixed} locale
         */
        $scope.setLocale = function(locale) {
            if (locale !== $scope.selectedLocale) {
                $scope.selectedLocale = locale;
                $scope.changeLocale();
            }
        }

        $scope.changeLocale = function() {
            var locale = $scope.selectedLocale;

            localStorage.setItem('i18nLanguage', locale.code);
            console.log('Language set to:', '(' +locale.code +') -', locale.label);

            i18nAdapter.setLocale(locale.code, ['i18n/' + locale.code + '.json'])
                .then(safeApply(locale));
        };

    });