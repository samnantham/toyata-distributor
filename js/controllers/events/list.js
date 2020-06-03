'use strict';

app.controller('EventsController', ['$scope', '$http', '$state', 'authServices', '$stateParams', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', '$ngConfirm', 'toaster', function($scope, $http, $state, authServices, $stateParams, webServices, utility, $rootScope, $timeout, $filter, $ngConfirm, toaster) {

    $scope.events = [];
    $scope.pagedata = [];
    $scope.pageno = 1;
    $scope.totalData = 0;
    $scope.totalPerPage = $rootScope.pagelimits[0];
    $rootScope.loading = true;
    $scope.filterData = {};
    $scope.filterData.sortorder = '';
    $scope.errorData = {};

    $scope.seterrorMsg = function(){
        $scope.errorData.title_errorMsg = 'Enter Title';
        $scope.errorData.description_errorMsg = 'Please add workshop content';
        $scope.errorData.start_date_errorMsg = 'Select Event Date';
    }

    $scope.changeActive = function(tab){
        if($scope.activetab != tab){
            $rootScope.loading = true;
            $scope.activetab = tab;
            $scope.filterData.status = tab;
            if(tab != 'create'){
                $scope.getResults();
            }else{
                
                $timeout(function() {
                    $scope.formData = {};
                    $scope.formData.event_files = [];
                    $scope.formData.event_documents = [];
                    $scope.formData.event_start_time = new Date().setHours(8,0);
                    $scope.formData.event_end_time = new Date().setHours(18,0);
                    $scope.formData.latitude = $rootScope.latlong.lat;
                    $scope.formData.longitude = $rootScope.latlong.long;
                    $scope.formData.location = $rootScope.latlong.location;
                    $scope.autocomplete = $rootScope.latlong.location;
                    $rootScope.loading = false;
                }, 1000);
            }
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
                $scope.formData.start_date = $filter('date')($scope.formData.event_start_date, 'yyyy-MM-dd');
                if($scope.formData.event_end_date){
                    $scope.formData.end_date = $filter('date')($scope.formData.event_end_date, 'yyyy-MM-dd');
                }$scope.formData.start_time = $filter('date')($scope.formData.event_start_time, 'yyyy-MM-dd HH:mm:ss');
                $scope.formData.end_time = $filter('date')($scope.formData.event_end_time, 'yyyy-MM-dd HH:mm:ss');
                webServices.upload('event', $scope.formData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.changeActive('upcoming');
                        $scope.formData = {};
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
            }if (!form.start_date.$valid) {
                $scope.errorData.start_date_error = true;
            }
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.addeventfiles = function(files) {
        $scope.errors = [];
        if ($scope.formData.event_files.length < $rootScope.maxUploadFiles) {
            if (files && files.length) {
                if (($rootScope.maxUploadFiles - $scope.formData.event_files.length) >= files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var extn = files[i].name.split(".").pop();
                        if ($rootScope.validextensions.includes(extn.toLowerCase())) {
                            if (files[i].size <= $rootScope.maxUploadsize) {
                                var newobj = {};
                                newobj.file = files[i];
                                newobj.filename = files[i].name;
                                newobj.filetype = files[i].type.split("/")[0];
                                newobj.isfile = 1;
                                $scope.formData.event_files.push(newobj);
                            } else {
                                $scope.errors.push(files[i].name + ' size exceeds 2MB.')
                            }
                        } else {
                            $scope.errors.push(files[i].name + ' format unsupported.');
                        }
                    }
                } else {
                    $scope.errors.push('You can now upload only ' + ($rootScope.maxUploadFiles - $scope.formData.event_files.length) + ' files');
                }
            }
        } else {
            $scope.errors.push('You can add only maximum of ' + $rootScope.maxUploadFiles + ' files only');
        }
        if ($scope.errors.length > 0) {
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.addeventDocuments = function(files) {
        $scope.errors = [];
        if ($scope.formData.event_documents.length < $rootScope.maxUploadFiles) {
            if (files && files.length) {
                if (($rootScope.maxUploadFiles - $scope.formData.event_documents.length) >= files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var extn = files[i].name.split(".").pop();
                        if ($rootScope.validfileextensions.includes(extn.toLowerCase())) {
                            if (files[i].size <= $rootScope.maxUploadsize) {
                                var newobj = {};
                                newobj.file = files[i];
                                newobj.filename = files[i].name;
                                newobj.filetype = files[i].type.split("/")[0];
                                newobj.isfile = 1;
                                $scope.formData.event_documents.push(newobj);
                            } else {
                                $scope.errors.push(files[i].name + ' size exceeds 2MB.')
                            }
                        } else {
                            $scope.errors.push(files[i].name + ' format unsupported.');
                        }
                    }
                } else {
                    $scope.errors.push('You can now upload only ' + ($rootScope.maxUploadFiles - $scope.formData.event_documents.length) + ' files');
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
        $rootScope.loading = true;
        webServices.post($scope.url + '?page=' + $scope.pageno,$scope.filterData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.pagination = {
                    current: $scope.pageno
                };
                $scope.pagedata[$scope.pageno] = getData.data;
                $scope.events = getData.data;
            } else {
                //$rootScope.logout();
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
        $scope.url = 'event/paginate/' + $scope.totalPerPage;
        $scope.getResults();
    };

    if(!$stateParams.type){
        $scope.activetab = 'all';
        $scope.filterData.status = 'all';
    }else{
        $scope.activetab = $stateParams.type;
        $scope.filterData.status = $stateParams.type;
    }

     $scope.placeChanged =  function() {
        var location = this.getPlace();
        $scope.formData.location = location.formatted_address;
        $scope.formData.latitude = location.geometry.location.lat();
        $scope.formData.longitude = location.geometry.location.lng();
        $scope.$apply();
    };

    $scope.onDragEnd = function(marker, $event) {
        var lat = marker.latLng.lat();
        var lng = marker.latLng.lng();
        var geocoder = new $event.google.maps.Geocoder();
        geocoder.geocode({
            'latLng': new $event.google.maps.LatLng(lat, lng)
        }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    $timeout(function() {
                        $scope.formData.latitude = results[0].geometry.location.lat();
                        $scope.formData.longitude = results[0].geometry.location.lng();
                        $scope.formData.location = results[0].formatted_address;
                        $scope.$apply();
                    }, 300);
                } else {
                    alert('No results found');
                }
            } else {
                alert('Geocoder failed due to: ' + status);
            }
        });
    }

    $scope.removeFile = function(key,data){
        $scope.formData.event_files.splice(key,1);
    }

    $scope.removeDocuments = function(key,data){
        $scope.formData.event_documents.splice(key,1);
    }
    
    $scope.getDatas();

}]);