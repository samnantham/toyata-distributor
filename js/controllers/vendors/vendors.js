'use strict';

app.controller('VendorController', ['$scope', '$http', '$state', 'authServices', '$sessionStorage', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', 'SweetAlert', 'toaster', function($scope, $http, $state, authServices, $sessionStorage, webServices, utility, $rootScope, $timeout, $filter, SweetAlert, toaster) {

    $scope.vendors = [];
    $scope.pagedata = [];
    $scope.pageno = 1;
    $scope.totalData = 0;
    $scope.totalPerPage = $rootScope.pagelimits[0];
    $scope.keyword = '';
    $rootScope.loading = true;
    $scope.sortorder = '';

   $scope.deleteData = function(key, value) {

        SweetAlert.swal({
                title: "Are you sure?",
                text: "Your will not be able to recover this once deleted!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function(isConfirm) {
                if (isConfirm) {
                    webServices.delete('vendor/delete/' + value.id).then(function(getData) {
                        if (getData.status == 200) {
                            $scope.getResultsPage();
                        } else {
                            $rootScope.$emit("showISError",getData);
                        }
                    });
                }
            });
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
        $scope.getResultsPage();
    };


    $scope.sortData = function(key) {
        $scope.sortkey = key;
        $scope.pagedata = [];
        $scope.pageno = 1;
        if ($scope.sortorder == '') {
            $scope.sortorder = 'asc';
        } else if ($scope.sortorder == 'asc') {
            $scope.sortorder = 'desc';
        } else {
            $scope.sortorder = '';
        }
        if ($scope.sortorder) {
            if ($scope.keyword.length > 0) {
                $scope.url = 'vendor/searchsort/'+ $scope.keyword + '/' + $scope.sortkey + '/' + $scope.sortorder + '/' + $scope.totalPerPage;
            } else {
                $scope.url = 'vendor/sort/' + $scope.sortkey + '/' + $scope.sortorder + '/' + $scope.totalPerPage;
            }
        } else if ($scope.keyword.length > 0) {
            $scope.url = 'vendor/search/' + $scope.keyword + '/' + $scope.totalPerPage;
        } else {
            $scope.url = 'vendor/get/paginate/' + $scope.totalPerPage;
        }
        $scope.getResultsPage();
    }

    $scope.search = function() {
        $scope.pagedata = [];
        $scope.pageno = 1;
        if ($scope.keyword.length > 0) {
            if ($scope.sortorder) {
                $scope.url = 'vendor/searchsort/' + $scope.keyword + '/' + $scope.sortkey + '/' + $scope.sortorder + '/' + $scope.totalPerPage;
            } else {
                $scope.url = 'vendor/search/' + $scope.keyword + '/' + $scope.totalPerPage;
            }
        } else {
            $scope.url = 'vendor/get/paginate/' + $scope.totalPerPage;
        }
        $scope.getResultsPage();
    }

    $scope.getResultsPage = function() {
        $rootScope.loading = true;
        webServices.get($scope.url + '?page=' + $scope.pageno).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.pagination = {
                    current: $scope.pageno
                };
                $scope.pagedata[$scope.pageno] = getData.data;
                $scope.vendors = getData.data;
            } else {
                $rootScope.logout();
            }
        });
    };

    $scope.closeModal = function() {
        $scope.blockData = {};
        $('#BlockModal').modal('hide');
        if($scope.selectedkey != null){
            $scope.resetstatus();
        }
        $rootScope.errors = [];
    }

    $scope.resetstatus = function(){
        if($scope.selectedPerson.status){
            $scope.vendors.data[$scope.selectedkey].status = 0;
        }else{
            $scope.vendors.data[$scope.selectedkey].status = 1;
        }
    }

    $scope.openModal = function() {
        $scope.blockData = {};
        $scope.blockData.id = $scope.selectedPerson.id;
        $scope.blockData.status = $scope.selectedPerson.status;
        $scope.blockData.module = 2;
        $rootScope.errors = [];
        $('#BlockModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }
    
    $scope.changeStatus = function(key,data) {
        $scope.selectedkey = key;
        $scope.selectedPerson = data;
        SweetAlert.swal({
            title: "Are you sure?",
            text: "Want to change the status?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, do it!",
            closeOnConfirm: true,
            closeOnCancel: true
        },function(isConfirm) 
        {
            if (isConfirm){
                $scope.openModal();
            }else{
                $scope.resetstatus();
            }
        });
    }

    $scope.block = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            webServices.put('vendor/updatestatus', $scope.blockData).then(function(getData) {
                $rootScope.loading = false;
                if (getData.status == 200) {
                    $scope.selectedkey = null;
                    $scope.closeModal();
                    $scope.getResultsPage();
                    //$scope.vendors.data[key].status = status;
                } else {
                    $rootScope.$emit("showISError",getData);
                }
            });
        } else {
            if (!form.reason.$valid) {
                $scope.errors.push('Please enter reason to Block/Unblock');
            }
            $rootScope.$emit("showModalErrors", $scope.errors);
        }
    }

    $scope.viewData = function(data) {
        $scope.formData = {};
        $scope.formData = data;

        $('#ViewModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

     $scope.pageChanged = function(newPage) {
        $scope.pageno = newPage;
        if(!$scope.pagedata[$scope.pageno]){
            $scope.getResultsPage();
        }else{
            $scope.vendors = $scope.pagedata[$scope.pageno];
        }
    };

    $scope.getDatas = function() {
        $scope.pageno = 1;
        $scope.url = 'vendor/get/paginate/' + $scope.totalPerPage;
        $scope.getResultsPage();
    };

    $scope.getDatas();


}]);