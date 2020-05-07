'use strict';
app.controller('FGTPWDController', ['$scope', '$http', '$state', 'authServices', '$sessionStorage', 'webServices', '$timeout', '$rootScope' , 'toaster' , function($scope, $http, $state, authServices, $sessionStorage, webServices, $timeout, $rootScope , toaster) {

    $scope.formData = {};
    $rootScope.loading = false;
    
    $scope.addData = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            webServices.normalpost('password/forgot', $scope.formData).then(function(getData) {
                $rootScope.loading = false;
                if(getData.status == 200) {
                    $rootScope.$emit("showSuccessMsg", getData.data.message);
                    $timeout(function() {
                        $state.go('access.signin');
                    }, 1000);
                } else {
                    $rootScope.$emit("showErrorMsg", getData.data.message);
                }
            });

        } else {
            if (!form.email.$valid) {
                form.email.$pristine = false;
                $scope.errors.push('Please Enter a valid email'); 
            }
            $rootScope.$emit("showErrors", $scope.errors);
        }
    };

}]);