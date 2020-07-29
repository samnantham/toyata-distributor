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
                dayClick: function( date, allDay, jsEvent, view ) {

                },eventClick: function (event) {
                    $rootScope.formData = event;
                    $rootScope.openeventModal();
                    console.log(event)
                },viewRender: function(view, element) {
                    var monthyear = view.title.split(' ');
                    var month = $rootScope.getMonthFromString(view.title.split(' ')[0]);
                    var year = parseInt(monthyear[1]);
                    if($scope.firstloadingdone){
                        $scope.getMonthevents(month,year);
                    }
                }
            }
        };

        $scope.goToitem = function(item){
            if(item.whatsnew_type == 2){
                $state.go('app.viewevent', {
                    id: item.id
                });

            }else if(item.whatsnew_type == 3){
                $state.go('app.viewkaizen', {
                    id: item.id
                });    
            }
            console.log(item)
        }

        $scope.viewEvent = function(){
            if($rootScope.formData.type < 4){
                if ($rootScope.formData.type == 1) {
                    $state.go('app.viewevent', {
                        id: $rootScope.formData.caleventInfo.item
                    });
                } else if ($rootScope.formData.type == 2) {
                    $state.go('app.viewtbp', {
                        id: $rootScope.formData.caleventInfo.item
                    });
                } else if ($rootScope.formData.type == 3) {
                    $state.go('app.viewkaizen', {
                        id: $rootScope.formData.caleventInfo.item
                    });
                }
            }
        }

        $scope.updateReminder = function(reminder){
            var obj = {};
            obj.item = reminder.item;
            obj.module = reminder.module;
            webServices.put('reminder/update',obj).then(function(getData) {
                console.log(getData)
                /*if (getData.status == 200) {
                    $rootScope.loading = false;
                    $scope.calendarevents = getData.data;
                    angular.forEach($scope.calendarevents, function(data, no) {
                        data.start = new Date(data.start);
                    });
                    $scope.eventSources.splice(0,1);
                    $scope.eventSources.push($scope.calendarevents);
                } else {
                    $rootScope.$emit("showerror", getData);
                }*/
            });
        }

        $scope.getMonthevents = function(month,year){
            webServices.get('calendar/info/'+month+'/'+year).then(function(getData) {
                console.log(getData)
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
                    angular.forEach($scope.homeData.whatsnew, function(data, no) {
                        if(data.whatsnew_type == 3){
                            data.typeData =  $rootScope.kaizentypes.filter(function(kaizen){
                                return kaizen.id == data.type;
                            })[0];
                        }
                    });
                    $scope.eventSources = [$scope.calendarevents];
                    console.log($scope.eventSources)
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
            } else if (data.type == 3) {
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

        $rootScope.openeventModal = function() {
            $('#EventInfoModal').modal({
                backdrop: 'static',
                keyboard: false
            });
        }

        EventInfoModal

        $rootScope.closeModal = function() {
            $rootScope.formData = {};
            $('#PopupModal').modal('hide');
            $('#EventInfoModal').modal('hide');
        }

        $scope.getData();

    }
    ]);