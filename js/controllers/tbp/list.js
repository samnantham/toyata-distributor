'use strict';

app.controller('TBPController', ['$scope', '$http', '$state', 'authServices', '$stateParams', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', '$ngConfirm', 'toaster', function($scope, $http, $state, authServices, $stateParams, webServices, utility, $rootScope, $timeout, $filter, $ngConfirm, toaster) {

    $scope.events = [];
    $scope.pagedata = [];
    $scope.pageno = 1;
    $scope.totalData = 0;
    $scope.totalPerPage = $rootScope.pagelimits[0];
    $rootScope.loading = true;
    $scope.filterData = {};
    $scope.activetab = $stateParams.type;
    $scope.filterData.type = $stateParams.type;
    $scope.filterData.sortorder = '';
    $scope.errorData = {};

    $scope.seterrorMsg = function(){
        $scope.errorData.title_errorMsg = 'Enter Title';
        $scope.errorData.invitation_errorMsg = 'Please upload invitations';
        $scope.errorData.survey_link_errorMsg = 'Not a valid URL';
    }

    $scope.changeActive = function(tab){
        if($scope.activetab != tab){
            $rootScope.loading = true;
            $scope.activetab = tab;
            $scope.filterData.type = tab;
            if($scope.activetab == 4){
                $scope.url = 'pdca/paginate/' + $scope.totalPerPage;
            }
            $scope.getResults();
        }
    }

    $scope.setservererrorMsg = function(errors){
        $scope.errorData = {};
        angular.forEach(errors, function(error, no) {
            $scope.errorData[no] = error[0];
            $scope.errorData[no] = true;
        });
    }

    $scope.addData = function(form) {
        $scope.formData.invitations_data = 1;
        $scope.inputchange();
        $scope.checkInvitations();
        if (form.$valid) {
                $rootScope.loading = true;
                webServices.upload('tbp', $scope.formData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.closeModal();
                        $scope.getResults();
                    } else if (getData.status == 401) {
                        $scope.setservererrorMsg(getData.data.message);
                        $rootScope.loading = false;
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
        } else {
            if (!form.title.$valid) {
                $scope.errorData.title_error = true;
            }if(!$scope.formData.invitations_data){
                if (!form.invitations.$valid) {
                    $scope.errorData.invitation_error = true;
                }
            }
            if (!form.survey_link.$valid) {
                $scope.errorData.survey_link_error = true;
            }
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.checkInvitations = function(){
        $scope.inputchange();
        if ($scope.formData.invitations.length > 0) {
            var invitations = angular.copy($scope.formData.invitations);
            for (var i = invitations.length - 1; i >= 0; i--) {
                if (!invitations[i].name||!invitations[i].filename) {
                    $scope.formData.invitations_data = 0;
                }
            };
        }
    }

    $scope.uploadInvitation = function(no,files) {
        $scope.errors = [];
        if (files && files.length) {
            var extn = files[0].name.split(".").pop();
            if ($rootScope.validfileextensions.includes(extn.toLowerCase())) {
                if (files[0].size <= $rootScope.maxUploadsize) {
                    $scope.formData.invitations[no].filename = files[0].name;
                    $scope.formData.invitations[no].file = files[0];
                    $scope.formData.invitations[no].filetype = files[0].type.split("/")[0];
                    $scope.formData.invitations[no].isfile = 1;
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

   $scope.addtbpfiles = function(files) {
        $scope.errors = [];
        if ($scope.formData.tbp_files.length < $rootScope.maxUploadFiles) {
            if (files && files.length) {
                if (($rootScope.maxUploadFiles - $scope.formData.tbp_files.length) >= files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var extn = files[i].name.split(".").pop();
                        if ($rootScope.validextensions.includes(extn.toLowerCase())) {
                            if (files[i].size <= $rootScope.maxUploadsize) {
                                var newobj = {};
                                newobj.file = files[i];
                                newobj.filename = files[i].name;
                                newobj.filetype = files[i].type.split("/")[0];
                                newobj.isfile = 1;
                                $scope.formData.tbp_files.push(newobj);
                            } else {
                                $scope.errors.push(files[i].name + ' size exceeds 2MB.')
                            }
                        } else {
                            $scope.errors.push(files[i].name + ' format unsupported.');
                        }
                    }
                } else {
                    $scope.errors.push('You can now upload only ' + ($rootScope.maxUploadFiles - $scope.formData.tbp_files.length) + ' files');
                }
            }
        } else {
            $scope.errors.push('You can add only maximum of ' + $rootScope.maxUploadFiles + ' files');
        }
        if ($scope.errors.length > 0) {
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.sortData = function(key,order) {
        $scope.filterData.sortkey = key;
        $scope.filterData.sortorder = order;
        $scope.pagedata = [];
        $scope.pageno = 1;
        $scope.getResults();
    }

    $scope.getResults = function() {
        $rootScope.loading = true;
        webServices.post($scope.url + '?page=' + $scope.pageno,$scope.filterData).then(function(getData) {
            $rootScope.loading = false;
            console.log(getData)
            if (getData.status == 200) {
                $scope.pagination = {
                    current: $scope.pageno
                };
                $scope.pagedata[$scope.pageno] = getData.data;
                $scope.tbps = getData.data;
            } else {
               // $rootScope.logout();
            }
        });
    };

    $scope.pageChanged = function(newPage) {
        $scope.pageno = newPage;
        if (!$scope.pagedata[$scope.pageno]) {
            $scope.getResults();
        } else {
            $scope.events = $scope.pagedata[$scope.pageno];
        }
    };

    $scope.getDatas = function() {
        $scope.pageno = 1;
        $scope.url = 'tbp/paginate/' + $scope.totalPerPage;
        $scope.getResults();
    };

    $scope.removeFile = function(key,data){
        $scope.formData.tbp_files.splice(key,1);
    }

    $scope.closeModal = function() {
        $scope.formData = {};
        $scope.isedit = false;
        $('#PopupModal').modal('hide');
        $rootScope.modalerrors = [];
    }
    
    $scope.openaddModal = function() {
        $scope.inputchange();
        $scope.formData = {};
        $scope.formData.type = $stateParams.type;
        $scope.formData.invitations = [{name:'',file:'',filename:''}];
        $scope.formData.tbp_files = [];
        $('#PopupModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.addInvitation = function(){
        var obj = {name:'',file:'',filename:''};
        $scope.formData.invitations.push(obj);
    }

    $scope.removeInvitation = function(key){
        $scope.formData.invitations.splice(key,1);
    }

    $scope.inputchange = function() {
        $scope.errorData = {};
        $scope.seterrorMsg();
    }
    
    $scope.getDatas();

}]);