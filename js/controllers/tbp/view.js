'use strict';

app.controller('TBPInfoController', ['$scope', '$http', '$state', '$stateParams', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', '$ngConfirm', '$sce', function($scope, $http, $state, $stateParams, webServices, utility, $rootScope, $timeout, $filter, $ngConfirm, $sce) {

    $scope.tbp = {};
    $rootScope.loading = true;
    $scope.filterData = {};

    $scope.getData = function() {
        webServices.get('tbp/' + $stateParams.id).then(function(getData) {
            if (getData.status == 200) {
                $scope.tbp = getData.data;
                $scope.tbp.videocount = $rootScope.getfileCounts($scope.tbp.tbp_files, 'video');
                $scope.tbp.imagecount = $rootScope.getfileCounts($scope.tbp.tbp_files, 'image');
                $scope.gettbpParticipants();
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.gettbpParticipants = function(){
         webServices.get('tbp/participants/' + $stateParams.id).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.tbp.participants = getData.data;
                console.log($scope.tbp)
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.removeTBPParticipant = function(id){
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
                        $scope.deleteParticipant(id);
                    }
                },
                cancel: {
                    text: 'No',
                    action: function() {}
                }
            }
        });
    }

    $scope.deleteParticipant = function(id){
        webServices.delete('tbp/participant/' + id).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $scope.gettbpParticipants();
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.openParticipantModal = function(){
        $scope.distributors = [];
        $scope.divisions = [];
        $scope.addedData = {};
        $scope.addedData.tbp = $stateParams.id;
        $scope.addedData.members = [];
        $scope.getDistributors();
        $('#ParticipantModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.addremoveMember = function(status,id){
        if(status){
            $scope.addedData.members.push(id);
        }else{
            var index = $scope.addedData.members.indexOf(id);
            if (index !== -1) $scope.addedData.members.splice(index, 1);
        }
    }

    $scope.updateParticipants = function(){
        webServices.post('tbp/participants', $scope.addedData).then(function(getData) {
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $scope.gettbpParticipants();
                $scope.closeModal();
            }/* else {
                $rootScope.logout();
            }*/
        });

    }

    $scope.getUsers = function() {
        webServices.post('user/filter', $scope.filterData).then(function(getData) {
            if (getData.status == 200) {
                $scope.users = getData.data;
            } else {
                $rootScope.logout();
            }
        });
    };

    $scope.getDivisions = function() {
        $scope.getUsers();
        $scope.divisions = [];
        webServices.get('division/' + $scope.filterData.distributor).then(function(getData) {
            if (getData.status == 200) {
                $scope.divisions = getData.data;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.removeEvent = function() {
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
                        $scope.deleteEvent();
                    }
                },
                cancel: {
                    text: 'No',
                    action: function() {}
                }
            }
        });
    }

    $scope.deleteEvent = function(id) {
        webServices.delete('tbp/' + $stateParams.id).then(function(getData) {
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $state.go('app.tbps', {
                    type: 1
                });
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.removeFile = function(key, data) {
        if (!data.isfile) {
            $scope.formData.deleted_tbp_files.push(data);
        }
        $scope.formData.tbp_files.splice(key, 1);
    }

    $scope.closeModal = function() {
        $scope.formData = {};
        $scope.isedit = false;
        $scope.addedData = {};
        $scope.filterData = {};
        $('#ParticipantModal').modal('hide');
        $('#PopupModal').modal('hide');
    }

    $scope.editTBP = function() {
        $scope.inputchange();
        $scope.formData = {};
        $scope.formData = angular.copy($scope.tbp);
        $scope.formData.deleted_invitations = [];
        $scope.formData.deleted_tbp_files = [];
        $('#PopupModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.addInvitation = function() {
        var obj = {
            name: '',
            file: '',
            filename: ''
        };
        $scope.formData.invitations.push(obj);
    }

    $scope.removeInvitation = function(key,data) {
        if (!data.isfile) {
            $scope.formData.deleted_invitations.push(data);
        }
        $scope.formData.invitations.splice(key, 1);
    }

    $scope.inputchange = function() {
        $scope.errorData = {};
        $scope.seterrorMsg();
    }

    $scope.seterrorMsg = function() {
        $scope.errorData.title_errorMsg = 'Enter Title';
        $scope.errorData.invitation_errorMsg = 'Please upload invitations';
        $scope.errorData.survey_link_errorMsg = 'Not a valid URL';
    }

    $scope.setservererrorMsg = function(errors) {
        $scope.errorData = {};
        angular.forEach(errors, function(error, no) {
            $scope.errorData[no] = error[0];
            $scope.errorData[no] = true;
        });
    }

    $scope.checkInvitations = function() {
        $scope.inputchange();
        $scope.formData.invitations_data = 1;
        if ($scope.formData.invitations.length > 0) {
            var invitations = angular.copy($scope.formData.invitations);
            for (var i = invitations.length - 1; i >= 0; i--) {
                if (!invitations[i].name || !invitations[i].filename) {
                    $scope.formData.invitations_data = 0;
                }
            };
        }
    }

    $scope.uploadInvitation = function(no, files) {
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

    $scope.addData = function(form) {
        $scope.formData.invitations_data = 1;
        $scope.inputchange();
        $scope.checkInvitations();
        if (form.$valid) {
            $rootScope.loading = true;
            webServices.putupload('tbp/' + $stateParams.id, $scope.formData).then(function(getData) {
                $rootScope.loading = false;
                if (getData.status == 200) {
                    $rootScope.$emit("showSuccessMsg", getData.data.message);
                    $scope.closeModal();
                    $scope.getData();
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
            }
            if (!$scope.formData.invitations_data) {
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

    $scope.getDistributors = function() {
        webServices.get('distributor/get/all').then(function(getData) {
            if (getData.status == 200) {
                $scope.distributors = getData.data;
                $scope.getUsers();
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.getData();

}]);