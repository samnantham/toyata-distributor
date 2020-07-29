'use strict';

app.controller('TBPInfoController', ['$scope', '$state', '$stateParams', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', '$ngConfirm', '$sce', function($scope, $state, $stateParams, webServices, utility, $rootScope, $timeout, $filter, $ngConfirm, $sce) {

    $scope.tbp = {};
    $scope.filterData = {};
    $scope.tbp_uploads = angular.copy($rootScope.tbp_upload_types);

    $scope.getData = function() {
        webServices.get('tbp/' + $stateParams.id).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.tbp = getData.data;
                $scope.mediafiles = $rootScope.splitFiles($scope.tbp.tbp_files); 
                if(Object.keys($scope.tbp).length > 0){
                    $scope.tbp.videocount = $rootScope.getfileCounts($scope.tbp.tbp_files, 'video');
                    $scope.tbp.imagecount = $rootScope.getfileCounts($scope.tbp.tbp_files, 'image');
                    if($scope.tbp.uploads){
                        angular.forEach($scope.tbp_uploads, function(upload, no) {
                            upload.fileurl =  $scope.tbp.uploads[upload.typename];
                            upload.item_class = '';
                            if((no + 1) % 2 == 0){
                                //upload.item_class = 'disabled';
                                upload.fileurl =  $scope.tbp.uploads[upload.typename];
                                if(($scope.tbp_uploads[no - 1].is_approved) || (!$scope.tbp_uploads[no - 1].is_approved && $scope.tbp_uploads[no - 1].admin_upload)){
                                    upload.item_class = '';
                                }
                            }else{
                                var approved = upload.typename + '_approved';
                                var is_admin_upload = upload.typename + '_is_admin_upload';
                                var admin_file = upload.typename + '_admin_file';
                                upload[approved] =  $scope.tbp.uploads[approved];
                                upload.is_approved =  $scope.tbp.uploads[approved];
                                upload[is_admin_upload] =  $scope.tbp.uploads[is_admin_upload];
                                upload.admin_file =  $scope.tbp.uploads[admin_file];
                                upload.admin_upload =  $scope.tbp.uploads[is_admin_upload];
                                if(no > 0){
                                    if(($scope.tbp.uploads[$scope.tbp_uploads[no - 1].typename] === undefined) || ($scope.tbp.uploads[$scope.tbp_uploads[no - 1].typename] === null) || ($scope.tbp.uploads[$scope.tbp_uploads[no - 1].typename] === '')){
                                        //upload.item_class = 'disabled';
                                    }
                                }else{
                                    if($scope.tbp.uploads[approved]){
                                       //upload.item_class = 'disabled';
                                    }
                                }
                            }
                        });
                    }else{
                            angular.forEach($scope.tbp_uploads, function(upload, no) {
                                if(no > 0){
                                    upload.item_class = 'disabled';
                                }
                            });
                        }

                        console.log($scope.tbp_uploads)
                }else{
                    $state.go('app.tbps',{'type':1});
                }
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.uploadReport = function(type,files) {
        $scope.errors = [];
        if (files && files.length) {
            var extn = files[0].name.split(".").pop();
            if ($rootScope.validfileextensions.includes(extn.toLowerCase())) {
                if (files[0].size <= $rootScope.maxUploadsize) {
                    $scope.tbpuploadData = {};
                    $scope.tbpuploadData.tbp = $stateParams.id;
                    $scope.tbpuploadData.newdocument = files[0];
                    $scope.tbpuploadData.type = type;
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
                        $scope.tbpuploadData = {};
                        $scope.tbpuploadData.newdocument = '';
                    }
                }
            }
        });
    }

    $scope.uploadDocument = function(){
        webServices.upload('tbp/report/upload', $scope.tbpuploadData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $scope.tbpuploadData = {};
                $scope.tbpuploadData.newdocument = '';
                $scope.getData();
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    };

    $scope.getData();

}]);