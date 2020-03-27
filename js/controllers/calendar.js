'use strict';
app.controller('CalendarCtrl', ['$scope', 'webServices', '$rootScope', '$http', '$filter',
    function($scope, webServices, $rootScope, $http, $filter) {
        $rootScope.loading = true;
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

        $scope.getMonthevents = function(month,year) {
            webServices.get('calendar/info/'+month+'/'+year).then(function(getData) {
                if (getData.status == 200) {
                    $rootScope.loading = false;
                    $scope.calendarevents = getData.data;
                    angular.forEach($scope.calendarevents, function(data, no) {
                        data.start = new Date(data.start);
                    });
                    if(!$scope.firstloadingdone){
                        $scope.eventSources = [$scope.calendarevents];
                        $scope.firstloadingdone = true;
                    }else{
                        $scope.eventSources.splice(0,1);
                        $scope.eventSources.push($scope.calendarevents);
                    }
                } else {
                    $rootScope.$emit("showerror", getData);
                }
            });
        }

        var d = new Date();
        $scope.getMonthevents(d.getMonth(),d.getYear());

    }
]);