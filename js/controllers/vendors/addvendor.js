'use strict';

app.controller('AddVendorController', ['$scope', '$http', '$state', 'authServices', '$sessionStorage', 'webServices', 'utility', '$rootScope', '$stateParams', '$timeout', 'toaster', '$filter', function($scope, $http, $state, authServices, $sessionStorage, webServices, utility, $rootScope, $stateParams, $timeout, toaster, $filter) {

    $scope.formData = {};
    $rootScope.loading = false;
    $scope.formData.ismainbranch = 0;
    $scope.formData.latitude = 0;
    $scope.formData.longitude = 0;
    $scope.formData.has_booking = 0;

    $scope.addData = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            webServices.upload('vendor/add', $scope.formData).then(function(getData) {
                $rootScope.loading = false;
                if (getData.status == 200) {
                    $rootScope.$emit("showSuccessMsg", getData.data.message);
                    $rootScope.goback();
                } else if (getData.status == 401) {
                    $scope.errors = utility.getError(getData.data.message);
                    $rootScope.loading = false;
                    $rootScope.$emit("showErrors", $scope.errors);
                } else {
                    $rootScope.$emit("showISError",getData);
                }
            });
        } else {
            if (!form.logo.$valid) {
                $scope.errors.push('Please upload company logo');
            }if (!form.postal_code.$valid) {
                $scope.errors.push('Please enter postal code');
            }if (!form.phone_number.$valid) {
                $scope.errors.push('Please enter phone number');
            }if (!form.email.$valid) {
                $scope.errors.push('Please enter valid email');
            }if (!form.company_name.$valid) {
                $scope.errors.push('Please enter company name');
            }/*if (!form.uen_number.$valid) {
                $scope.errors.push('Please enter UEN number');
            }if (!form.gst_number.$valid) {
                $scope.errors.push('Please enter GST number');
            }*/
            
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.getLatandLong = function(zipcode) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            'address': zipcode
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                $scope.formData.latitude = results[0].geometry.location.lat();
                $scope.formData.longitude = results[0].geometry.location.lng();
            } else {
                $scope.formData.latitude = 0;
                $scope.formData.longitude = 0;
            }
        });
    }


}]);