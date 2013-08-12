'use strict';

app.config(['$translateProvider', function ($translateProvider) {
    $translateProvider.useStaticFilesLoader({
        prefix: 'i18n/locales/',
        suffix: '.json'
    });
    $translateProvider.preferredLanguage('en-US');
    $translateProvider.fallbackLanguage('en-US');
}]);

app.controller('I18nCtrl', ['$scope', '$translate' , function ($scope, $translate) {

//<==== Just for testing ====>
    $scope.now = function(){
        return new Date();
    }

    $scope.customDateFormat = "HH:mm";
    $scope.customNumber = Math.random().toFixed(9) * 1000000;
    $scope.customCurrency = Math.random().toFixed(8) * 1000000;
//<==== Just for testing ====>

    function findLocale(code) {
        var returnValue = _.find($scope.locales, {'code': code});
        return (returnValue ? returnValue: $scope.locales[0]);
    }

    function getBrowserLanguageCode(){
        var language = window.navigator.userLanguage || window.navigator.language;
        return (language.length == 2 ? language + '-' + language.toUpperCase() : language);
    }

    /**
     * Safe applys the changes to the controller
     * @param {Mixed} locale
     */
    function safeApply(locale) {
        if ($scope.selectedLocale != locale) {
            $scope.selectedLocale = locale;

            $translate.uses(locale.code);

            if (!$scope.$$phase) $scope.$apply();

            console.log('i18n > Language set to:', locale.code + ' - ' + locale.name);
        }
    }

    $scope.locales = [];
    $scope.selectedLocale = {};

    /**
     * Changes the locale
     * @param {Mixed} locale
     */
    $scope.changeLocale = function (locale) {
        safeApply(locale);
    };

    /**
     * Loads all available locales from locales.json.
     */
    $.ajax('i18n/locales.json', {dataType: 'json', async: false}).then(function(data) {
        $scope.locales = data;
        console.log('i18n > Locales loaded:', data.length);
        safeApply(findLocale(getBrowserLanguageCode()));
    });

}]);