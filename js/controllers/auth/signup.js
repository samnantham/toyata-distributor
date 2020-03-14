'use strict';
app.controller('SignUpFormController', ['$scope', '$timeout', '$state', 'authServices', '$sessionStorage', 'webServices', 'utility', '$rootScope' , 'toaster' , function($scope, $timeout, $state, authServices, $sessionStorage, webServices, utility, $rootScope , toaster) {

    $rootScope.loading = false;
    $scope.formData = {};
    $scope.formData.shownewpassword = false;
    $scope.formData.showconfirmpassword = false;
    $scope.formData.newtype = 'password';
    $scope.formData.confirmtype = 'password';

    $scope.register = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            webServices.normalpost('register', $scope.formData).then(function(getData) {
                $rootScope.loading = false;
                if(getData.status==200) {
                    $rootScope.user = $sessionStorage.user = getData.data;
                    localStorage.user = JSON.stringify($sessionStorage.user);
                    $state.go('app.chatlist');
                } else {
                    $scope.errors = utility.getError(getData.data.message);
                    if(getData.data.authstatus == 1){
                        $rootScope.$emit("showSuccessMsg", $scope.errors[0]);
                        $timeout(function() {
                            $state.go('access.signin');
                        }, 5000);
                    }else{
                        $rootScope.$emit("showErrors", $scope.errors);
                    }
                }
            });
        } else {
            if (!form.confirm_password.$valid) {
               $scope.errors.push('Please confirm your password'); 
            }if (!form.password.$valid) {
                $scope.errors.push('Please enter your password'); 
            }if (!form.phone.$valid) {
               $scope.errors.push('Please Enter a valid phone'); 
            }if (!form.email.$valid) {
                $scope.errors.push('Please enter your email'); 
            }if (!form.last_name.$valid) {
               $scope.errors.push('Please Enter your Last Name'); 
            }if (!form.first_name.$valid) {
                $scope.errors.push('Please enter your First name'); 
            }if (!form.division.$valid) {
                $scope.errors.push('Please select division'); 
            }if (!form.distributor.$valid) {
                $scope.errors.push('Please select distributor'); 
            }
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.getDistributors = function() {
        webServices.get('distributor/list').then(function(getData) {
            if (getData.status == 200) {
                $scope.distributors = getData.data;
                $rootScope.loading = false;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.getDivisions = function(){
        webServices.get('division/list/'+$scope.formData.distributor).then(function(getData) {
            if (getData.status == 200) {
                $scope.divisions = getData.data;
                $rootScope.loading = false;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.showhidepassword = function(type) {
        if (type == 'password') {
            $scope.formData.showpassword = !$scope.formData.showpassword;
            if ($scope.formData.showpassword) {
                $scope.formData.passwordtype = 'text';
            } else {
                $scope.formData.passwordtype = 'password';
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

    $scope.getDistributors();

}]);