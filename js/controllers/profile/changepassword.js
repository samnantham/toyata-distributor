'use strict';
app.controller('ChangePasswordController', ['$scope', '$http', '$state', 'authServices', '$sessionStorage', 'webServices', 'utility', '$rootScope', '$stateParams', '$timeout', 'toaster',  '$firebaseArray', function($scope, $http, $state, authServices, $sessionStorage, webServices, utility, $rootScope, $stateParams, $timeout, toaster, $firebaseArray) {

    $scope.formData = {};
    $scope.authError = '';
    $rootScope.loading = false;
    $scope.formData.showcurrentpassword = false;
    $scope.formData.shownewpassword = false;
    $scope.formData.showconfirmpassword = false;
    $scope.formData.currenttype = 'password';
    $scope.formData.newtype = 'password';
    $scope.formData.confirmtype = 'password';

    $scope.updatePassword = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $scope.loading = true;
            webServices.put('password/update', $scope.formData).then(function(getData) {
                if (getData.status == 200) {
                    $rootScope.$emit("showSuccessMsg", getData.data.message);
                    $timeout(function() {
                        authServices.logout();
                    }, 2000);
                } else {
                    $scope.errors = utility.getError(getData.data.message);
                    $rootScope.$emit("showErrors", $scope.errors);
                }
                $scope.loading = false;
            });
        } else {
            if (!form.oldpassword.$valid) {
                $scope.errors.push('Current password required');
            }
            if (!form.newpassword.$valid) {
                $scope.errors.push('New password required and minimum 8 charecters');
            }
            if (!form.confirmpassword.$valid) {
                $scope.errors.push('Confirm password required and minimum 8 charecters');
            }
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }


    $scope.showhidepassword = function(type) {
        if (type == 'current') {
            $scope.formData.showcurrentpassword = !$scope.formData.showcurrentpassword;
            if ($scope.formData.showcurrentpassword) {
                $scope.formData.currenttype = 'text';
            } else {
                $scope.formData.currenttype = 'password';
            }
        } else if (type == 'new') {
            $scope.formData.shownewpassword = !$scope.formData.shownewpassword;
            if ($scope.formData.shownewpassword) {
                $scope.formData.newtype = 'text';
            } else {
                $scope.formData.newtype = 'password';
            }
        } else {
            $scope.formData.showconfirmpassword = !$scope.formData.showconfirmpassword;
            if ($scope.formData.showconfirmpassword) {
                $scope.formData.confirmtype = 'text';
            } else {
                $scope.formData.confirmtype = 'password';
            }
        }
    }

}]);