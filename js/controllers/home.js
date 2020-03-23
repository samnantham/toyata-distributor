'use strict';
app.controller('DashboardCtrl', ['$scope', '$state', 'webServices', '$rootScope', 'authServices', '$timeout', '$sessionStorage', 'NgMap', '$http', '$filter',
    function($scope, $state, webServices, $rootScope, authServices, $timeout, $sessionStorage, NgMap, $http, $filter) {
        
        $rootScope.$emit("setSliderConfig",{});
        $scope.eventSources = [];

        $scope.getData = function() {
            webServices.get('home/info').then(function(getData) {
                $rootScope.loading = false;
                if (getData.status == 200) {
                    $scope.homeData = getData.data;
                    $scope.calendarevents = getData.data.caldata;
                    angular.forEach($scope.calendarevents, function(data, no) {
                        data.start = new Date(data.start);
                    });
                    $scope.eventSources = [$scope.calendarevents];
                } else {
                    $rootScope.$emit("showerror", getData);
                }
            });
        }

        $scope.viewItem = function(data){
            $rootScope.formData = {};
            $rootScope.formData = data;
            if(data.type == 2){
                $state.go('app.viewevent',{id:data.id});
            }else{
                $rootScope.openModal();
            }
        }

        $rootScope.openModal = function() {
            console.log($rootScope.formData)
            $('#PopupModal').modal({
                backdrop: 'static',
                keyboard: false
            });
        }

        $rootScope.closeModal = function() {
            $rootScope.formData = {};
            $('#PopupModal').modal('hide');
        }
    
        $scope.getData();

    }
]);