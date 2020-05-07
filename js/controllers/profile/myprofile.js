'use strict';
app.controller('ProfileController', ['$scope', '$http', '$state', 'authServices', '$sessionStorage', 'webServices', 'utility', '$rootScope', '$timeout', 'toaster', function($scope, $http, $state, authServices, $sessionStorage, webServices, utility, $rootScope, $timeout, toaster) {

    $scope.formData = {};
    $scope.isedit = false;

    $scope.getUser = function() {
        webServices.get('getauthenticateduser').then(function(getData) {
            if (getData.status == 200) {
                $scope.formData = getData.data;
            } else {
                authServices.logout();
            }
            $rootScope.loading = false;
        });
    }

    $scope.uploadAvatar = function(files) {
        $scope.errors = [];
        if (files && files.length) {
            var extn = files[0].name.split(".").pop();
            if ($rootScope.imgextensions.includes(extn.toLowerCase())) {
                if (files[0].size <= $rootScope.maxUploadsize) {
                    $scope.formData.newavatar = files[0];
                } else {
                    $scope.errors.push(files[0].name + ' size exceeds 2MB.')
                }
            } else {
                $scope.errors.push(files[0].name + ' format unsupported.');
            }

        }
        if ($scope.errors.length > 0) {
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.editData = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            webServices.putupload('profile/update', $scope.formData).then(function(getData) {
                $rootScope.loading = false;
                if (getData.status == 200) {
                    $rootScope.$emit("showSuccessMsg", getData.data.message);
                    $timeout(function() {
                        $rootScope.user = $sessionStorage.user = getData.data.data;
                        localStorage.user = JSON.stringify($sessionStorage.user);
                        $scope.$apply();
                        $scope.isedit = false;
                    }, 500);
                } else if (getData.status == 401) {
                    $scope.errors = utility.getError(getData.data.message);
                    $rootScope.$emit("showErrors", $scope.errors);
                } else {
                    $rootScope.$emit("showISError",getData);
                }

            });
        } else {
            if (!form.username.$valid) {
                $scope.errors.push("User name required.");
            }
            $scope.showerrors();
        }
    }

    $scope.showEdit = function(){
        $scope.isedit = !$scope.isedit;
    }
    
    $scope.getUser();

}]);