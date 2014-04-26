/**
 * ngRunabove: Angular Service for RunAbove API - Example 01
 *
 * @author Jean-Philippe Blary (@blary_jp)
 * @url https://github.com/blaryjp/ng-runabove
 * @license MIT
 */

var myApp = angular.module('myApp', [
    'ngRunabove'    // Require the ngRunabove module here
]);

// Configure the RunAbove module
myApp.config(function (RunaboveProvider) {

    // Set the Application Key (AK):
    RunaboveProvider.setAppKey('YOUR_APPLICATION_KEY');

    // Set the Application Secret (AS):
    RunaboveProvider.setAppSecret('YOUR_APPLICATION_SECRET');

});

myApp.controller('myInfosCtrl', function ($scope, Runabove) {

    // Am I logged ?
    $scope.isLogged = Runabove.isLogged();

    // User click on the "Log in" button
    $scope.login = function () {
        Runabove.login(window.location.href);
    };

    // If user is logged, get informations from Runabove API
    if ($scope.isLogged) {
        Runabove.get('/me').then(function (infosFromApi) {
            $scope.infos = infosFromApi;
        });
    }

});
