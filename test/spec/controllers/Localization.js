'use strict';

describe('Controller: LocalizationCtrl', function () {

  // load the controller's module
  beforeEach(module('NGi18nTestApp'));

  var LocalizationCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LocalizationCtrl = $controller('LocalizationCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
