'use strict';

app.controller('TBPInfoController', ['$scope', '$http', '$state', '$stateParams', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', '$ngConfirm', '$sce', function($scope, $http, $state, $stateParams, webServices, utility, $rootScope, $timeout, $filter, $ngConfirm, $sce) {

    $scope.tbp = {};
    $scope.filterData = {};

    $scope.getData = function() {
        webServices.get('tbp/' + $stateParams.id).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.tbp = getData.data;
                $scope.tbp.videocount = $rootScope.getfileCounts($scope.tbp.tbp_files, 'video');
                $scope.tbp.imagecount = $rootScope.getfileCounts($scope.tbp.tbp_files, 'image');
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.getData();

}]);