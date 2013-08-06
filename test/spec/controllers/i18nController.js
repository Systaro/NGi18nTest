'use strict';

describe('Controller: I18nControllerCtrl', function () {

  // load the controller's module
  beforeEach(module('NGi18nTestApp'));

  var I18nControllerCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    I18nControllerCtrl = $controller('I18nControllerCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
