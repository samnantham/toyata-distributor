'use strict';

app.controller('KaizenInfoController', ['$scope', '$http', '$state', '$stateParams', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', '$ngConfirm', '$sce', function($scope, $http, $state, $stateParams, webServices, utility, $rootScope, $timeout, $filter, $ngConfirm, $sce) {

    $scope.kaizen = {};
    $rootScope.loading = true;

    $scope.getData = function() {
        webServices.get('kaizen/' + $stateParams.id).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.kaizen = getData.data;
                $scope.kaizen.videocount = $rootScope.getfileCounts($scope.kaizen.kaizen_files,'video'); 
                $scope.kaizen.imagecount = $rootScope.getfileCounts($scope.kaizen.kaizen_files,'image'); 
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

    $scope.removeFile = function(key,data){
        if(!data.isfile){
            $scope.formData.deleted_kaizen_files.push(data);
        }
        $scope.formData.kaizen_files.splice(key,1);
    }

    $scope.openaddModal = function() {
        $scope.inputchange();
        $scope.formData = {};
        $scope.formData = angular.copy($scope.kaizen);
        $scope.formData.type = $scope.formData.type.toString();
        $scope.formData.deleted_kaizen_files = [];
        $('#PopupModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.inputchange = function() {
        $scope.errorData = {};
        $scope.seterrorMsg();
    }

    $scope.closeModal = function() {
        $scope.formData = {};
        $scope.isedit = false;
        $('#PopupModal').modal('hide');
        $rootScope.modalerrors = [];
    }
    
    $scope.seterrorMsg = function(){
        $scope.errorData.title_errorMsg = 'Enter Title';
        $scope.errorData.description_errorMsg = 'Please add kaizen Study';
    }

    $scope.setservererrorMsg = function(errors){
        $scope.errorData = {};
        angular.forEach(errors, function(error, no) {
            $scope.errorData[no.replace('new','')+'_errorMsg'] = error[0];
            $scope.errorData[no.replace('new','')+'_error'] = true;
        });
    }

    $scope.uploadCover = function(files) {
        $scope.errors = [];
        if (files && files.length) {
            var extn = files[0].name.split(".").pop();
            if ($rootScope.imgextensions.includes(extn.toLowerCase())) {
                if (files[0].size <= $rootScope.maxUploadsize) {
                    $scope.formData.newcover = files[0];
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

    $scope.addkaizenfiles = function(files) {
        $scope.errors = [];
        if ($scope.formData.kaizen_files.length < $rootScope.maxUploadFiles) {
            if (files && files.length) {
                if (($rootScope.maxUploadFiles - $scope.formData.kaizen_files.length) >= files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var extn = files[i].name.split(".").pop();
                        if ($rootScope.validextensions.includes(extn.toLowerCase())) {
                            if (files[i].size <= $rootScope.maxUploadsize) {
                                var newobj = {};
                                newobj.file = files[i];
                                newobj.filename = files[i].name;
                                newobj.filetype = files[i].type.split("/")[0];
                                newobj.isfile = 1;
                                $scope.formData.kaizen_files.push(newobj);
                            } else {
                                $scope.errors.push(files[i].name + ' size exceeds 2MB.')
                            }
                        } else {
                            $scope.errors.push(files[i].name + ' format unsupported.');
                        }
                    }
                } else {
                    $scope.errors.push('You can now upload only ' + ($rootScope.maxUploadFiles - $scope.formData.kaizen_files.length) + ' files');
                }
            }
        } else {
            $scope.errors.push('You can add only maximum of ' + $rootScope.maxUploadFiles + ' files only');
        }
        if ($scope.errors.length > 0) {
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.addData = function(form) {
        $scope.seterrorMsg();
        if (form.$valid) {
            $rootScope.loading = true;
                webServices.putupload('kaizen/'+$stateParams.id, $scope.formData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $state.reload();
                    } else if (getData.status == 401) {
                        $scope.setservererrorMsg(getData.data.message);
                        $rootScope.loading = false;
                    }/* else {
                        $rootScope.$emit("showISError", getData);
                    }*/
                });
        } else {
            if (!form.title.$valid) {
                $scope.errorData.title_error = true;
            }if (!form.description.$valid) {
                $scope.errorData.description_error = true;
            }
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.removeKaizen = function() {
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
                        $scope.deleteKaizen();
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

    $scope.deleteKaizen = function(id){
        webServices.delete('kaizen/' + $stateParams.id).then(function(getData) {
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $state.go('app.kaizens',{type:1});
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

   $scope.getData();

}]);