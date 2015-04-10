'use strict';
/*global angular */
/*jshint unused:false */

/**
 * The main TodoMVC app module
 *
 * @type {angular.Module}
 */
var myApp = angular.module('myApp', [
    'firebase',
    'ui.bootstrap',
    'ngRoute',
    'todoControllers',
    'cfp.hotkeys',
    'ngAnimate'
]);


myApp.filter('isAfter', function() {
    return function(todos) {
        return todos.filter(function(todo) {
            if (!todo.snooze) {
                return true;
            } else {
                var test = new Date(todo.snooze);
                return moment().isAfter(test);
            }
        })
    }
});

myApp.run(["$rootScope", "$location", function($rootScope, $location) {
    $rootScope.$on("$routeChangeError", function(event, next, previous, error) {
        // We can catch the error thrown when the $requireAuth promise is rejected
        // and redirect the user back to the home page
        if (error === "AUTH_REQUIRED") {
            $location.path("/login");
        }
    });

    /******** TO BE USED TO REDIRECT USER TO MOBILE-APP DOWNLOAD PAGE IF ON MOBILE BROWSER *********
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        console.log('Mobile Browser Detected.  Redirecting.');

        document.location = "mobile.html"
    }
    */

}]);

myApp.factory('Auth', ['$firebaseAuth', function($firebaseAuth) {
    var ref = new Firebase('https://ang-todo-app.firebaseio.com/');
    return $firebaseAuth(ref);
}]);

myApp.controller('AuthCtrl', ['$scope', '$rootScope', 'Auth', '$location', function($scope, $rootScope, Auth, $location) {
    $scope.auth = Auth;
    // any time auth status updates, add the user data to scope
    $scope.auth.$onAuth(function(authData) {
        $scope.authData = authData;
    });


    $scope.logout = function() {
        Auth.$unauth();
        $location.path('/login');
        console.log('Logged Out');
    };

    $scope.login = function() {
        Auth.$authWithOAuthPopup("google").then(function(authData) {
            //console.log("Logged in as:", authData.uid);
            $location.path('/');
        }).catch(function(error) {
            console.error("Authentication failed:", error);
        });
        //CHANGE SO IF USER ALREADY EXISTS IT"S NO OVERRIDING
        Auth.$onAuth(function(authData) {

            // save the user's profile into Firebase so we can list users,
            // use them in Security and Firebase Rules, and show profiles



            var ref = new Firebase("https://ang-todo-app.firebaseio.com/users/");
            var userId = authData.uid;

            checkIfUserExists(userId);

            function userExistsCallback(userId, exists) {
                if (exists) {

                    console.log('user ' + userId + ' exists!');
                } else {
                    if (authData) {
                        ref.child(authData.uid).set({
                            provider: authData.provider,
                            name: getName(authData),
                            userStatus: 0
                        });
                    }

                    $rootScope.firstTimeUser = true;
                    //update so if doesn't exist it shows instructions
                    console.log('user ' + userId + ' does not exist!');
                }
            }

            // Tests to see if /users/<userId> has any data. 
            function checkIfUserExists(userId) {

                ref.child(userId).once('value', function(snapshot) {
                    var exists = (snapshot.val() !== null);
                    userExistsCallback(userId, exists);
                });
            }

        });

        // find a suitable name based on the meta info given by each provider
        function getName(authData) {
            switch (authData.provider) {
                case 'password':
                    return authData.password.email.replace(/@.*/, '');
                case 'google':
                    return authData.google.displayName;
            }
        }
    };
}]);

myApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'partials/todoList.html',
            controller: 'todoCtrl',
            resolve: {
                'currentAuth': ['Auth', function(Auth) {
                    // $waitForAuth returns a promise so the resolve waits for it to complete
                    return Auth.$requireAuth();
                }]
            }
        })
        .when('/login', {
            templateUrl: 'partials/home.html',
            controller: 'AuthCtrl'
        })
        .when('/mobile', {
            templateUrl: 'partials/mobile.html',
            controller: 'MobileCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);