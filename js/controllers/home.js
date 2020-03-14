'use strict';
app.controller('DashboardCtrl', ['$scope', '$ngConfirm', 'webServices', '$rootScope', 'authServices', '$timeout', '$sessionStorage', 'NgMap', '$http', '$filter',
    function($scope, $ngConfirm, webServices, $rootScope, authServices, $timeout, $sessionStorage, NgMap, $http, $filter) {
        $rootScope.slickConfig = {
                    enabled: true,
                    autoplay: false,
                    draggable: true,
                    slidesToShow: 5,//$rootScope.slidecount,
                    slidesToScroll:5,// $rootScope.scrollslides,
                    arrows: true,
                    prevArrow: "<img class='slick-prev slick-arrow' src='img/sliderL.png'>",
                    nextArrow: "<img class='slick-next slick-arrow' src='img/sliderR.png'>",
                    method: {},
                    infinite: false    
        };

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

    
        $scope.getData();

    }
]);