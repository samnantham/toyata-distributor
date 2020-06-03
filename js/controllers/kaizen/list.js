'use strict';

app.controller('KaizenController', ['$scope', '$http', '$state', 'authServices', '$stateParams', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', '$ngConfirm', 'toaster', function($scope, $http, $state, authServices, $stateParams, webServices, utility, $rootScope, $timeout, $filter, $ngConfirm, toaster) {

    $scope.kaizenlist = [];
    $scope.pagedata = [];
    $scope.pageno = 1;
    $scope.totalData = 0;
    $scope.totalPerPage = $rootScope.pagelimits[0];
    $rootScope.loading = true;
    $scope.filterData = {};
    $scope.filterData.sortorder = '';
    $scope.activetab = $stateParams.type;
    $scope.filterData.status = $stateParams.type;
    $scope.errorData = {};

    $scope.changeActive = function(tab){
        if($scope.activetab != tab){
            $rootScope.loading = true;
            $scope.activetab = tab;
            $scope.filterData.type = tab;
            $scope.getResults();
        }
    }

    $scope.seterrorMsg = function(){
        $scope.errorData.title_errorMsg = 'Enter Title';
        $scope.errorData.description_errorMsg = 'Please add kaizen Study';
    }

    $scope.removeVideoLink = function(key){
        $scope.formData.video_links.splice(key,1);
    }

    $scope.uploadvideo = function() {
        if (($rootScope.validURL($scope.videoData.link))&&($rootScope.validvideo($scope.videoData.link))) {

            if($scope.formData.video_links.some(videolink => videolink.link === $scope.videoData.link)){
                $rootScope.$emit("showErrorMsg", 'Video already added');
            } else{
                var newobj = {};
                newobj.link = $scope.videoData.link;
                newobj.title = 'video link' + ($scope.formData.video_links.length + 1);
                newobj.info = '';
                $scope.formData.video_links.push(newobj);
                $scope.videoData = {};
            }
        }else{
            $rootScope.$emit("showErrorMsg", 'Please upload valid video url.');
            $scope.videoData.link = '';
        }  
    }

    $scope.removeDocumentLink = function(key){
        $scope.formData.document_links.splice(key,1);
    }

    $scope.uploaddocumentlink = function() {
        if ($rootScope.validURL($scope.documentData.link)) {

            if($scope.formData.document_links.some(documentlink => documentlink.link === $scope.documentData.link)){
                $rootScope.$emit("showErrorMsg", 'Document already added');
            } else{
                var newobj = {};
                newobj.link = $scope.documentData.link;
                newobj.name = 'External link' + ($scope.formData.document_links.length + 1);
                newobj.info = '';
                $scope.formData.document_links.push(newobj);
                $scope.documentData = {};
            }
        }else{
            $rootScope.$emit("showErrorMsg", 'Please enter a valid document link.');
            $scope.documentData.link = '';
        }  
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

    $scope.addData = function(form) {
        $scope.seterrorMsg();
        if (form.$valid) {
            $rootScope.loading = true;
                webServices.upload('kaizen', $scope.formData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.changeActive($scope.activetab);
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
            }if (!form.description.$valid) {
                $scope.errorData.description_error = true;
            }
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

    $scope.addkaizenDocuments = function(files) {
        $scope.errors = [];
        if ($scope.formData.kaizen_documents.length < $rootScope.maxUploadFiles) {
            if (files && files.length) {
                if (($rootScope.maxUploadFiles - $scope.formData.kaizen_documents.length) >= files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var extn = files[i].name.split(".").pop();
                        if ($rootScope.validfileextensions.includes(extn.toLowerCase())) {
                            if (files[i].size <= $rootScope.maxUploadsize) {
                                var newobj = {};
                                newobj.file = files[i];
                                newobj.name = files[i].name.split(".")[0];
                                newobj.info = '';
                                newobj.filetype = files[i].type.split("/")[0];
                                newobj.isfile = 1;
                                $scope.formData.kaizen_documents.push(newobj);
                            } else {
                                $scope.errors.push(files[i].name + ' size exceeds 2MB.')
                            }
                        } else {
                            $scope.errors.push(files[i].name + ' format unsupported.');
                        }
                    }
                } else {
                    $scope.errors.push('You can now upload only ' + ($rootScope.maxUploadFiles - $scope.formData.kaizen_documents.length) + ' files');
                }
            }
        } else {
            $scope.errors.push('You can add only maximum of ' + $rootScope.maxUploadFiles + ' files only');
        }
        if ($scope.errors.length > 0) {
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.changeLimit = function(totalPerPage) {
        $scope.totalPerPage = totalPerPage;
        $scope.pagedata = [];
        $scope.pageno = 1;
        if ($scope.sortorder) {
            $scope.pagedata = [];
            $scope.pageno = 1;
            $scope.url = 'vendor/sort/' + $scope.sortkey + '/' + $scope.sortorder + '/' + $scope.totalPerPage;
        } else {
            $scope.url = 'vendor/get/paginate/' + $scope.totalPerPage;
        }
        $scope.getResults();
    };

    $scope.sortData = function(key,order) {
        $scope.filterData.sortkey = key;
        $scope.filterData.sortorder = order;
        $scope.pagedata = [];
        $scope.pageno = 1;
        $scope.getResults();
    }

    $scope.getResults = function() {
        webServices.post($scope.url + '?page=' + $scope.pageno,$scope.filterData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.pagination = {
                    current: $scope.pageno
                };
                $scope.pagedata[$scope.pageno] = getData.data;
                $scope.kaizenlist = getData.data;
            } else {
                //$rootScope.logout();
            }
        });
    };

    $scope.openaddModal = function() {
        $scope.inputchange();
        $scope.formData = {};
        $scope.formData.type = $stateParams.type;
        $scope.formData.kaizen_files = [];
        $scope.formData.video_links = [];
        $scope.formData.kaizen_documents = [];
        $scope.formData.document_links = [];
        $('#PopupModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.closeModal = function() {
        $scope.formData = {};
        $scope.isedit = false;
        $('#PopupModal').modal('hide');
        $rootScope.modalerrors = [];
    }

    $scope.inputchange = function() {
        $scope.errorData = {};
        $scope.seterrorMsg();
    }

    $scope.pageChanged = function(newPage) {
        $scope.pageno = newPage;
        if (!$scope.pagedata[$scope.pageno]) {
            $scope.getResults();
        } else {
            $scope.kaizenlist = $scope.pagedata[$scope.pageno];
        }
    };

    $scope.getDatas = function() {
        $rootScope.loading = true;
        $scope.pageno = 1;
        $scope.url = 'kaizen/paginate/' + $scope.totalPerPage;
        $scope.getResults();
    };

    $scope.removeFile = function(key,data){
        $scope.formData.kaizen_files.splice(key,1);
    }

    $scope.removeDocuments = function(key,data){
        $scope.formData.kaizen_documents.splice(key,1);
    }
    
    $scope.getDatas();

}]);