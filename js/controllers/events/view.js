'use strict';

app.controller('EventInfoController', ['$scope', '$http', '$state', '$stateParams', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', '$ngConfirm', '$sce', function($scope, $http, $state, $stateParams, webServices, utility, $rootScope, $timeout, $filter, $ngConfirm, $sce) {

    $scope.event = {};
    $rootScope.loading = true;
    $scope.now = new Date();
    $scope.commentData = {};
    $scope.commentData.isfile = 0;

    $scope.getData = function() {
        webServices.get('event/' + $stateParams.id).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                console.log(getData)
                $scope.event = getData.data;
                $scope.event.videocount = $rootScope.getfileCounts($scope.event.event_files,'video'); 
                $scope.event.imagecount = $rootScope.getfileCounts($scope.event.event_files,'image'); 
                $scope.getComments();
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

    $scope.getComments = function() {
        webServices.get('comments/' + $stateParams.id).then(function(getData) {
            $rootScope.loading = false;
            console.log(getData)
            if (getData.status == 200) {
                $scope.comments = getData.data;
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

    $scope.openaddModal = function() {
        $scope.inputchange();
        $scope.formData = {};
        if($scope.event.travelinfo){
            $scope.formData = angular.copy($scope.event.travelinfo);
            $scope.formData.travel_date = new Date(angular.copy($scope.formData.date_time));
            $scope.formData.arrival_time = new Date(angular.copy($scope.formData.date_time));

        }else{
            $scope.formData.arrival_time = new Date().setHours(0,0);
        }
        $('#PopupModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.uploadFile = function(files) {
        $scope.errors = [];
        if (files && files.length) {
            var extn = files[0].name.split(".").pop();
            if ($rootScope.imgextensions.includes(extn.toLowerCase())) {
                if (files[0].size <= $rootScope.maxUploadsize) {
                    $scope.commentData.commentfile = files[0];
                    $scope.commentData.isfile = 1;
                    $scope.commentData.item = $stateParams.id;
                    $scope.commentData.module = 1;
                    $scope.sendComment();
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

    $scope.addComment = function(){
        if($scope.commentData.comment){
            $scope.commentData.commentfile = '';
            $scope.commentData.isfile = 0;
            $scope.commentData.item = $stateParams.id;
            $scope.commentData.module = 1;
            $scope.sendComment();
        }
    }

    $scope.sendComment = function(){
         webServices.upload('comment',$scope.commentData).then(function(getData) {
            console.log(getData)
            $rootScope.loading = false;
            if (getData.status == 200) {
                 $scope.commentData = {};
                 $scope.getComments();
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

    $scope.inputchange = function() {
        $scope.errorData = {};
        $scope.seterrorMsg();
    }

    $scope.changeLike = function(){
        var obj = {};
        obj.module = 1;
        obj.item = $stateParams.id;
        if(parseInt($scope.event.isliked)){
            obj.status = 0;
        }else{
            obj.status = 1;
        }
        webServices.post('like',obj).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.event.isliked = obj.status;
                if(obj.status){
                    $scope.event.likes ++ ;
                }else{
                    $scope.event.likes -- ;
                }
                 
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

    $scope.closeModal = function() {
        $scope.formData = {};
        $scope.isedit = false;
        $('#PopupModal').modal('hide');
        $rootScope.modalerrors = [];
    }

    $scope.seterrorMsg = function() {
        $scope.errorData.name_errorMsg = 'Enter Your Name';
        $scope.errorData.phone_number_errorMsg = 'Enter Phone No';
        $scope.errorData.email_errorMsg = 'Enter Email';
        $scope.errorData.travel_date_errorMsg = 'Select Travel Date';
        $scope.errorData.flight_name_errorMsg = 'Enter Flight Name';
    }

    $scope.setservererrorMsg = function(errors){
        $scope.errorData = {};
        angular.forEach(errors, function(error, no) {
            $scope.errorData[no.replace('new','')+'_errorMsg'] = error[0];
            $scope.errorData[no.replace('new','')+'_error'] = true;
        });
    }

    $scope.addData = function(form) {
        $scope.seterrorMsg();
        if (form.$valid) {
            $rootScope.loading = true;
                var flightdate = angular.copy($scope.formData.travel_date);
                var arrivaltime = angular.copy($scope.formData.arrival_time);
                var hour = $filter('date')(angular.copy($scope.formData.arrival_time), 'HH');
                var mins = $filter('date')(angular.copy($scope.formData.arrival_time), 'mm');
                var datetime = flightdate.setHours(hour,mins);
                $scope.formData.date_time = $filter('date')(datetime, 'yyyy-MM-dd HH:mm:ss');
                webServices.upload('event/travel/'+$stateParams.id, $scope.formData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getData();
                    } else if (getData.status == 401) {
                        $scope.setservererrorMsg(getData.data.message);
                        $rootScope.loading = false;
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            } else {
            if (!form.name.$valid) {
                $scope.errorData.name_error = true;
            }
            if (!form.phone_number.$valid) {
                $scope.errorData.phone_number_error = true;
            }
            if (!form.email.$valid) {
                $scope.errorData.email_error = true;
            }
            if (!form.email.$valid) {
                $scope.errorData.email_error = true;
            }
            if (!form.travel_date.$valid) {
                $scope.errorData.travel_date_error = true;
            }
            if (!form.flight_name.$valid) {
                $scope.errorData.flight_name_error = true;
            }
        }
    }

   $scope.getData();

}]);