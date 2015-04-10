/*global todomvc, angular, Firebase */
'use strict';
var todoControllers = angular.module('todoControllers', []);

todoControllers.controller('todoCtrl', ['$scope', '$rootScope', '$modal', '$log', '$document','$firebaseArray', '$firebaseObject', 'currentAuth', 'hotkeys',
    function($scope, $rootScope, $modal, $log, $document, $firebaseArray, $firebaseObject, currentAuth, hotkeys) {
        var userID = currentAuth.uid;
        var ref = new Firebase('https://ang-todo-app.firebaseio.com/users/' + userID + '/todos');
        $scope.todos = $firebaseArray(ref);
        var refU = new Firebase('https://ang-todo-app.firebaseio.com/users/' + userID);
        $scope.profile = $firebaseObject(refU);

        hotkeys.add({
            combo: 'down',
            description: 'Create New Todo',
            callback: function() {
                $scope.down = true;
            }
        });

        $scope.submit = function() {
                      $scope.profile.userStatus = 1; 
            $scope.profile.$save(); 
            var newTodo = $scope.newTodo.trim();
            if (!newTodo.length) {
                return;
            }
            $scope.todos.$add({
                text: newTodo,
                complete: false,
                snooze: false
            });
            $scope.newTodo = '';
            $scope.down = false;
        };

        $scope.done = function(id) {
            $scope.todos.$remove($scope.todos.$indexFor(id));
        };

        $scope.revertEdit = function (id) {
            $scope.todos[$scope.todos.$indexFor(id)] = $scope.originalTodo;
            $scope.doneEditing($scope.todos.$indexFor(id));
        };

        $scope.edit = function(id) {
            $scope.editedTodo = $scope.todos[$scope.todos.$indexFor(id)];
            $scope.originalTodo = angular.extend({}, $scope.editedTodo);
        };

        $scope.doneEdit = function(id) {
            $scope.editedTodo = null;
            var text = $scope.todos[$scope.todos.$indexFor(id)].text.trim();
            if (text) {
                $scope.todos.$save($scope.todos.$indexFor(id));
            } else {
                $scope.todos.$remove($scope.todos.$indexFor(id));
            }
        };

        $scope.open = function(size, id) {
            var id = $scope.todos.$indexFor(id);
            var modalInstance = $modal.open({
                templateUrl: 'partials/timeModal.html',
                controller: 'ModalInstanceCtrl',
                size: size,
                resolve: {
                    items: function() {
                        return $scope.items;
                    }
                }
            });

            modalInstance.result.then(function(time) {
                $scope.todos[id].snooze = time;
                $scope.todos.$save(id);

            }, function() {
                $log.info('Modal dismissed at: ' + new Date());
            });
        };
        $scope.newTodo = '';
        $scope.show = false;
    }
]);

todoControllers.controller('ModalInstanceCtrl', ['$scope', '$modalInstance', 'items',
    function($scope, $modalInstance, items) {
        $scope.today = function() {
          $scope.dt = new Date();
        };
        $scope.today();

        $scope.minDate = $scope.minDate ? null : new Date();

        $scope.openCal = function() {
          $scope.selection = 'calendar';
        };

        
        $scope.ok = function(t, date) {
            console.log(t);
            $modalInstance.close(getTime(t, date));
        };

        function getTime(t, date) {
            switch (t) {
                case 'laterToday':
                    return moment().add(3,'h').toJSON();
                case 'tomorrow':
                    return moment().add(1,'d').startOf('day').toJSON();
                case 'thisWeekend':
                    return moment().day(6).startOf('day').toJSON();
                case 'nextWeek':
                    return moment().add(1,'w').startOf('week').toJSON();
                case 'nextMonth':
                    return moment().add(1,'M').startOf('month').toJSON();
                case 'setDate':
                    return moment(date).toJSON();
            }
        }
    }
]);


