'use strict';
app.controller('DashboardCtrl', ['$scope', '$state', 'webServices', '$rootScope', 'authServices', '$timeout', '$sessionStorage', 'NgMap', '$http', '$filter',
    function($scope, $state, webServices, $rootScope, authServices, $timeout, $sessionStorage, NgMap, $http, $filter) {

        $rootScope.$emit("setSliderConfig", {});
        $scope.firstloadingdone = false;
        
        $scope.uiConfig = {
            calendar: {
                height: 'auto',
                editable: true,
                header: {
                    left: 'prev,next',
                    center: 'title',
                    right: 'month basicWeek basicDay listDay listWeek listMonth,'
                },
                dayClick: $scope.alertOnEventClick,
                eventDrop: $scope.alertOnDrop,
                eventResize: $scope.alertOnResize,
                eventMouseover: $scope.alertOnMouseOver,
                viewRender: function(view, element) {
                    var monthyear = view.title.split(' ');
                    var month = $rootScope.getMonthFromString(view.title.split(' ')[0]);
                    var year = parseInt(monthyear[1]);
                    if($scope.firstloadingdone){
                        $scope.getMonthevents(month,year);
                    }
                }
            }
        };

        $scope.getMonthevents = function(month,year){
            webServices.get('calendar/info/'+month+'/'+year).then(function(getData) {
                if (getData.status == 200) {
                    $rootScope.loading = false;
                    $scope.calendarevents = getData.data;
                    angular.forEach($scope.calendarevents, function(data, no) {
                        data.start = new Date(data.start);
                    });
                    $scope.eventSources.splice(0,1);
                    $scope.eventSources.push($scope.calendarevents);
                } else {
                    $rootScope.$emit("showerror", getData);
                }
            });
        }

        $scope.getData = function() {
            webServices.get('home/info').then(function(getData) {
                $rootScope.loading = false;
                $scope.firstloadingdone = true;
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

        $scope.viewItem = function(data) {
            $rootScope.formData = {};
            $rootScope.formData = data;
            if (data.type == 2) {
                $state.go('app.viewevent', {
                    id: data.id
                });
            } else if (data.type == 2) {
                $state.go('app.viewkaizen', {
                    id: data.id
                });
            } else {
                $rootScope.openModal();
            }
        }

        $rootScope.openModal = function() {
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