'use strict';
app.controller('SigninFormController', ['$scope', '$http', '$state', 'authServices', '$sessionStorage', 'webServices', 'utility', '$rootScope' , 'toaster' , function($scope, $http, $state, authServices, $sessionStorage, webServices, utility, $rootScope , toaster) {

    $scope.formData = {};
    $rootScope.loading = false;

    if (localStorage.userData && localStorage.userData != 'undefined') {
        var userData = JSON.parse(localStorage.userData);
        if(userData.rememberme == 1){
            $scope.formData = JSON.parse(localStorage.userData);
        }
    }
    
    $scope.login = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            if($scope.formData.rememberme){
                localStorage.userData = JSON.stringify($scope.formData);
            }else{
                localStorage.userData = '';
            }
            webServices.normalpost('login', $scope.formData).then(function(getData) {
                $rootScope.loading = false;
                if(getData.status==200) {
                    $rootScope.user = $sessionStorage.user = getData.data;
                    localStorage.user = JSON.stringify($sessionStorage.user);
                    $state.go('app.home');
                } else {
                    $scope.errors = utility.getError(getData.data.message);
                    $rootScope.$emit("showErrors", $scope.errors);
                }
            });

        } else {
            if (!form.email.$valid) {
                form.email.$pristine = false;
                $scope.errors.push('Please Enter a valid email'); 
            }
            if (!form.password.$valid) {
                form.password.$pristine = false;
                $scope.errors.push('Please enter your password'); 
            }
            $rootScope.$emit("showErrors", $scope.errors);
        }
    };

}]);