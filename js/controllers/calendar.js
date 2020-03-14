'use strict';
app.controller('CalendarCtrl', ['$scope', 'webServices', '$rootScope', '$http', '$filter',
    function($scope, webServices, $rootScope, $http, $filter) {
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

        $scope.getData = function() {
            webServices.get('calendar/info').then(function(getData) {
                $rootScope.loading = false;
                if (getData.status == 200) {
                	console.log(getData.data)
                    $scope.events = getData.data;
                    angular.forEach($scope.events, function(data, no) {
                        data.start = new Date(data.start);
                        //data.stick = true;
                    });
                    $scope.eventSources = [$scope.events];
                } else {
                    $rootScope.$emit("showerror", getData);
                }
            });
        }

        $scope.getData();

    }
]);