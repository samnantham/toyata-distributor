'use strict';
app.controller('ResetPWDController', ['$scope', '$http', '$state', '$timeout', '$stateParams', 'webServices', 'utility', '$rootScope' , 'toaster' , function($scope, $http, $state, $timeout, $stateParams, webServices, utility, $rootScope , toaster) {

    $scope.formData = {};
    $rootScope.loading = false;
    $scope.formData.shownewpassword = false;
    $scope.formData.showconfirmpassword = false;
    $scope.formData.newtype = 'password';
    $scope.formData.confirmtype = 'password';
    
    $scope.addData = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            $scope.formData.reset_token = $stateParams.token;
            webServices.normalpost('password/reset', $scope.formData).then(function(getData) {
                $rootScope.loading = false;
                if(getData.status==200) {
                    $rootScope.$emit("showSuccessMsg", getData.data.message);
                    $timeout(function() {
                        $state.go('access.signin');
                    }, 1000);
                } else {
                    $rootScope.$emit("showErrorMsg", getData.data.message);
                }
            });

        } else {
            if (!form.newpassword.$valid) {
                $scope.errors.push('New password required and minimum 8 charecters'); 
            }if (!form.confirmpassword.$valid) {
                $scope.errors.push('Confirm password required and minimum 8 charecters'); 
            }if (!form.passwordmatch.$valid) {
                $scope.errors.push('Password not matched'); 
            }
            $rootScope.$emit("showErrors", $scope.errors);
        }
    };

    $scope.showhidepassword = function(type) {
        if (type == 'new') {
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