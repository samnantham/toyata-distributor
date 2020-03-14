'use strict';
app.controller('DashboardCtrl', ['$scope', '$ngConfirm', 'webServices', '$rootScope', 'authServices', '$timeout', '$sessionStorage', 'NgMap', '$http', '$filter',
    function($scope, $ngConfirm, webServices, $rootScope, authServices, $timeout, $sessionStorage, NgMap, $http, $filter) {

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
                eventMouseover: $scope.alertOnMouseOver
            }
        };

        $scope.changeUserStatus = function(key, id, status) {
            if (status == 0) {
                var status = 1;
                var title = 'You want to approve this user?';
            } else if (status == 1) {
                var status = 2;
                var title = 'You want to block this user?';
            } else {
                var status = 1;
                var title = 'You want to un block this user?';
            }
            $ngConfirm({
                title: title,
                content: '',
                type: 'red',
                typeAnimated: true,
                buttons: {
                    tryAgain: {
                        text: 'Yes',
                        btnClass: 'btn-red',
                        action: function() {
                            $scope.updateUserstatus(id, status);
                        }
                    },
                    cancel: {
                        text: 'No',
                        action: function() {}
                    }
                }
            });
        }

        $scope.updateUserstatus = function(id, status) {
            var obj = {};
            obj.id = id;
            obj.status = status;
            webServices.put('user/change/status', obj).then(function(getData) {
                if (getData.status == 200) {
                    $scope.getData();
                } else {
                    $rootScope.$emit("showISError", getData);
                }
            });
        }

        $rootScope.slickConfig = {
                    enabled: true,
                    autoplay: false,
                    draggable: true,
                    slidesToShow: 5,//$rootScope.slidecount,
                    slidesToScroll:5,// $rootScope.scrollslides,
                    arrows: true,
                    method: {},
                    infinite: false
                
                };

        $scope.deleteuserData = function(value) {
            $ngConfirm({
                title: 'Are you sure want to remove?',
                content: '',
                type: 'red',
                typeAnimated: true,
                buttons: {
                    tryAgain: {
                        text: 'Yes',
                        btnClass: 'btn-red',
                        action: function() {
                            $scope.deleteUser(value.id);
                        }
                    },
                    cancel: {
                        text: 'No',
                        action: function() {}
                    }
                }
            });
        }
        
        $scope.deleteUser = function(id) {
            webServices.delete('user/' + id).then(function(getData) {
                if (getData.status == 200) {
                    $scope.getResults();
                } else {
                    $rootScope.$emit("showISError", getData);
                }
            });
        }
        $scope.eventSources = [];

        $scope.getData = function() {
            webServices.get('home/info').then(function(getData) {
                $rootScope.loading = false;
                console.log(getData)
                if (getData.status == 200) {
                    $scope.homeData = getData.data;
                    $scope.calendarevents = getData.data.caldata;
                    angular.forEach($scope.calendarevents, function(data, no) {
                        data.start = new Date(data.start);
                    });

                    console.log($scope.shuffle(getData.data.dataarray))
                    //$scope.eventSources = [$scope.calendarevents];
                } else {
                    $rootScope.$emit("showerror", getData);
                }
            });
        }

        /*$scope.shuffle = function(array) {
          var currentIndex = array.length, temporaryValue, randomIndex;
          while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
          }
          return array;
        }
*/
        $scope.getData();

    }
]);