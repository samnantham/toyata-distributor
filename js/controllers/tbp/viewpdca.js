'use strict';

app.controller('PDCAInfoController', ['$scope', '$state', '$stateParams', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', '$ngConfirm', '$sce', function($scope, $state, $stateParams, webServices, utility, $rootScope, $timeout, $filter, $ngConfirm, $sce) {

    $scope.pdca = {};
    $scope.filterData = {};
    $scope.pdca_uploads = angular.copy($rootScope.pdca_upload_types);

    $scope.getData = function() {
        webServices.get('pdca/' + $stateParams.id).then(function(getData) {
            $rootScope.loading = false;
            console.log(getData)
            if (getData.status == 200) {
                $scope.pdca = getData.data;
                if(Object.keys($scope.pdca).length > 0){
                    if($scope.pdca.uploads){
                        angular.forEach($scope.pdca_uploads, function(upload, no) {
                            upload.fileurl =  $scope.pdca.uploads[upload.typename];
                            upload.item_class = '';
                            if((no + 1) % 2 == 0){
                                //upload.item_class = 'disabled';
                                upload.fileurl =  $scope.pdca.uploads[upload.typename];
                                if(($scope.pdca_uploads[no - 1].is_approved) || (!$scope.pdca_uploads[no - 1].is_approved && $scope.pdca_uploads[no - 1].admin_upload)){
                                    upload.item_class = '';
                                }
                            }else{
                                var approved = upload.typename + '_approved';
                                var is_admin_upload = upload.typename + '_is_admin_upload';
                                var admin_file = upload.typename + '_admin_file';
                                upload[approved] =  $scope.pdca.uploads[approved];
                                upload.is_approved =  $scope.pdca.uploads[approved];
                                upload[is_admin_upload] =  $scope.pdca.uploads[is_admin_upload];
                                upload.admin_file =  $scope.pdca.uploads[admin_file];
                                upload.admin_upload =  $scope.pdca.uploads[is_admin_upload];
                                if(no > 0){
                                    if(($scope.pdca.uploads[$scope.pdca_uploads[no - 1].typename] === undefined) || ($scope.pdca.uploads[$scope.pdca_uploads[no - 1].typename] === null) || ($scope.pdca.uploads[$scope.pdca_uploads[no - 1].typename] === '')){
                                        //upload.item_class = 'disabled';
                                    }
                                }else{
                                    if($scope.pdca.uploads[approved]){
                                       //upload.item_class = 'disabled';
                                   }
                               }
                           }
                       });
                    }else{
                        angular.forEach($scope.pdca_uploads, function(upload, no) {
                            if(no > 0){
                                upload.item_class = 'disabled';
                            }
                        });
                    }

                    console.log($scope.pdca_uploads)
                }else{
                    $state.go('app.tbps',{'type':4});
                }
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.viewVideo = function(data){
        var obj = {video : data.id,pdca : $stateParams.id };
        webServices.upload('pdca/view/video', obj).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                data.viewstatus = getData.data;
                $scope.showVideo(data);
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
        console.log(data)
    }

    $scope.openVideo = function(key,data){
        if($scope.pdca.has_questionnaire){
            if(key > 0){
                if($scope.pdca.videos[key - 1].status){
                    if(!data.viewstatus){
                        $scope.viewVideo(data);
                    }else{
                        $scope.showVideo(data);
                    }
                }else{
                    $rootScope.$emit("showErrorMsg", 'You are not passed past video questionaire');
                }
            }else{
                if(!data.viewstatus){
                    $scope.viewVideo(data);
                }else{
                    $scope.showVideo(data);
                }
            }
        }else{
            if(!data.viewstatus){
                $scope.viewVideo(data);
            }else{
                $scope.showVideo(data);
            }
        }
    }

    $scope.showVideo = function(data){
        $scope.videoData = data;
        var files = [];
        var obj = {};
        obj.type  = 'video';
        obj.thumbUrl  = 'img/logoLG.png';
        if(data.type == 2){
            obj.url  = data.video_link;
        }else{
            obj.url = $rootScope.IMGURL + data.video_link;
        }
        files.push(obj);
        $rootScope.openLightbox(files,0);
    }

    $scope.changeNext = function(){
        $scope.activeKey ++;
        $scope.questionData = $scope.questions[$scope.activeKey];
    }

    $scope.changePrevious = function(){
        $scope.activeKey --;
        $scope.questionData = $scope.questions[$scope.activeKey];
    }

    $scope.validateAnswer = function(){
        $ngConfirm({
            title: 'Are you sure want to submit this questionaire?',
            content: '',
            type: 'success',
            typeAnimated: true,
            buttons: {
                tryAgain: {
                    text: 'Yes',
                    btnClass: 'btn-red',
                    action: function() {
                        $rootScope.loading = true;
                        $scope.submitQuestions();
                    }
                },
                cancel: {
                    text: 'No',
                    action: function () {

                    }
                }
            }
        });
    }
    $scope.submitQuestions = function(){
        var obj = {};
        obj.pdca = $scope.questionData.pdca;
        obj.video_id = $scope.questionData.video_id;
        obj.questions = $scope.questions;
        webServices.post('pdca/validate/questions', obj ).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.closeModal();
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $scope.getData();
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.closeModal = function(){
        $scope.videoData = {};
        $scope.questionData = {};
        $scope.questions = [];
        $('#PopupModal').modal('hide');
        $('#VideoModal').modal('hide');
    }

    $scope.showQuestionaire = function(data){
        $scope.activeKey = 0;
        $scope.questions = data.questions;
        $scope.questionData = $scope.questions[$scope.activeKey];
        $('#PopupModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.uploadReport = function(type,files) {
        $scope.errors = [];
        if (files && files.length) {
            var extn = files[0].name.split(".").pop();
            if ($rootScope.validfileextensions.includes(extn.toLowerCase())) {
                if (files[0].size <= $rootScope.maxUploadsize) {
                    $scope.pdca_uploadData = {};
                    $scope.pdca_uploadData.pdca = $stateParams.id;
                    $scope.pdca_uploadData.newdocument = files[0];
                    $scope.pdca_uploadData.type = type;
                    $scope.confirmUpload();
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

    $scope.confirmUpload = function(){
        $ngConfirm({
            title: 'Are you sure want to upload this?',
            content: '',
            type: 'success',
            typeAnimated: true,
            buttons: {
                tryAgain: {
                    text: 'Yes',
                    btnClass: 'btn-red',
                    action: function() {
                        $scope.uploadDocument();
                    }
                },
                cancel: {
                    text: 'No',
                    action: function () {
                        $scope.pdca_uploadData = {};
                        $scope.pdca_uploadData.newdocument = '';
                    }
                }
            }
        });
    }

    $scope.uploadDocument = function(){
        webServices.upload('pdca/report/upload', $scope.pdca_uploadData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $scope.pdca_uploadData = {};
                $scope.pdca_uploadData.newdocument = '';
                $scope.getData();
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    };

    $scope.getData();

}]);