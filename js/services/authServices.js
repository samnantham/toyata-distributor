(function() {
    'use strict';

    angular.module('ui.load').service('authServices', authServices);

    /** @ngInject */
    function authServices($q, $http, $sessionStorage, $rootScope , $state) {

        var auth = {};

        /**
         *  Saves the current user in the root scope
         *  Call this in the app run() method
         */

        auth.init = function() {
            if (auth.isLoggedIn()) {
                $rootScope.user = auth.currentUser();
                return $rootScope.user;
            }
            return null;
        };

        auth.getToken = function() {
            if ((localStorage.user != '')&&(localStorage.user != undefined)&&(localStorage.user != 'undefined')) {
                $rootScope.user = JSON.parse(localStorage.user);
                return $rootScope.user.token;
            } else if (auth.isLoggedIn()) {
                $rootScope.user = auth.currentUser();
                return $rootScope.user.token;
            } else {
                return '';
            }
        }

        auth.logout = function() {
            $sessionStorage.$reset();
            delete $rootScope.user;
            localStorage.user = "";
            $rootScope.loading = false;
            $state.go('access.signin');
        };

        auth.checkPermissionForView = function(view) {
            if (!view.requiresAuthentication) {
                return true;
            }return userHasPermissionForView(view);
        };


        var userHasPermissionForView = function(view) {
            if (!auth.isLoggedIn()) {
                return false;
            }if (!view.permissions || !view.permissions.length) {
                return true;
            }return auth.userHasPermission(view.permissions);
        };


        auth.userHasPermission = function(permissions) {
            if (!auth.isLoggedIn()) {
                return false;
            }

            var found = false;
            angular.forEach(permissions, function(permission, index) {
                if ($sessionStorage.user.user_permissions.indexOf(permission) >= 0) {
                    found = true;
                    return;
                }
            });
            return found;
        };


        auth.currentUser = function() {
            if ($sessionStorage.user != null) {
                return $sessionStorage.user;
            }
            if ((localStorage.user != '')&&(localStorage.user != undefined)&&(localStorage.user != 'undefined')) {
                $rootScope.user = JSON.parse(localStorage.user);
                return $rootScope.user;
            }
        };

        auth.isLoggedIn = function() {
            var status = false;
            if((localStorage.user != '')&&(localStorage.user != undefined)&&(localStorage.user != 'undefined')) {
                status = true;
            }
            return status;
        };

        return auth;
    }

})();