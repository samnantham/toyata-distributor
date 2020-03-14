'use strict';
app.controller('EditVendorController', ['$http','$scope', 'SweetAlert', '$state', 'authServices', '$sessionStorage', 'webServices', 'utility', '$rootScope', '$stateParams', '$timeout', 'toaster', '$filter', 'Lightbox', function($http, $scope, SweetAlert, $state, authServices, $sessionStorage, webServices, utility, $rootScope, $stateParams, $timeout, toaster, $filter, Lightbox) {

    $scope.steps = {};
    $scope.formData = {};
    $scope.selected = {};
    $scope.selected.category = '';
    $scope.timelineData = {};
    $scope.timelineData.isfiles = '';
    $scope.Id = $stateParams.id;
    $rootScope.loading = true;
    $scope.subcategories = [];
    $scope.typecategories = [];

    $scope.getTime = function(date){
        return new Date(date).getTime();
    }

    $scope.deleteSlot = function(value) {
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
                    webServices.delete('timeslot/delete/' + value.emp_slot_id).then(function(getData) {
                        if (getData.status == 200) {
                            $scope.gettimeSlots($scope.selectedDate.getMonth(), $scope.selectedDate.getFullYear());
                        } else {
                            $rootScope.$emit("showISError", getData);
                        }
                    });
                }
            });
    }

     $scope.pageChanged = function(newPage) {
        $scope.pageno = newPage;
        if(!$scope.pagedata[$scope.pageno]){
            if ($scope.activetab == 'services') {
                $scope.getResultsPage();
            }else if ($scope.activetab == 'blog') {
                $scope.getBlogs();
            }
        }else{
            $scope.products = $scope.pagedata[$scope.pageno];
        }
    };

    $scope.changeFilter = function(filter) {
        if ($scope.currenttype != filter) {
            $scope.currenttype = filter;
            $scope.pagedata = [];
            $scope.pageno = 1;
            $scope.getVendorproducts();
        }
    }

    $scope.filterVIPS = function(gender) {
        if ($scope.searchData.gender != gender) {
            $scope.searchData.gender = gender;
            $scope.popup_pagedata  = [];
            $scope.popup_pagination = 1;
            $scope.getVips();
        }
    }

    $scope.filterCustomers = function(gender) {
        if ($scope.searchData.gender != gender) {
            $scope.searchData.gender = gender;
            $scope.popup_pagedata  = [];
            $scope.popup_pagination = 1;
            $scope.getCustomers();
        }
    }

    $scope.getVendorproducts = function() {
        $scope.pageno = 1;
        $scope.url = 'vendor/product/get/paginate/' + $scope.Id + '/' + $scope.totalPerPage + '/' + $scope.currenttype;
        $scope.getResultsPage();
    };

    $scope.changePrime = function(user){
        webServices.put('vendor/customers/setprime/' +$scope.Id + '/' + user.id + '/' + user.isprime).then(function(getData) {
            if (getData.status == 200) {
                //$scope.employees.data[key].status = status;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.sortableOptions = {
        helper: $rootScope.fixHelper,
        tolerance: 'pointer',
        update: function(event, ui) {
            $scope.priorityData = {};
            $scope.priorityData.items = $scope.formData.menus;
            webServices.put('vendor/menu/updatepriority', $scope.priorityData).then(function(getData) {
                if (getData.status == 200) {}
            });
        }
    };

    $scope.timelinesortableOptions = {
        helper: $rootScope.fixHelper,
        tolerance: 'pointer',
        update: function(event, ui) {
        }
    };

    $scope.protimelinesortableOptions = {
        helper: $rootScope.fixHelper,
        tolerance: 'pointer',
        update: function(event, ui) {
        }
    };

    $scope.blogtimelinesortableOptions = {
        helper: $rootScope.fixHelper,
        tolerance: 'pointer',
        update: function(event, ui) {
        }
    };


    $scope.productsortableOptions = {
        helper: $rootScope.fixHelper,
        tolerance: 'pointer',
        update: function(event, ui) {
            $scope.priorityData = {};
            $scope.priorityData.items = $scope.products.data;
            $scope.priorityData.limit = $scope.totalPerPage;
            $scope.priorityData.pageno = $scope.pageno;
            webServices.put('vendor/product/updatepriority', $scope.priorityData).then(function(getData) {
                if (getData.status == 200) {}
            });
        }
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
            if ($scope.searchData.keyword.length > 0) {
                $scope.url = 'vendor/product/searchsort/' + $scope.Id + '/' + $scope.searchData.keyword + '/' + $scope.sortkey + '/' + $scope.sortorder + '/' + $scope.totalPerPage + '/' + $scope.currenttype;
            } else {
                $scope.url = 'vendor/product/sort/' + $scope.Id + '/' + $scope.sortkey + '/' + $scope.sortorder + '/' + $scope.totalPerPage + '/' + $scope.currenttype;
            }
        } else if ($scope.searchData.keyword.length > 0) {
            $scope.url = 'vendor/product/search/' + $scope.Id + '/' + $scope.searchData.keyword + '/' + $scope.totalPerPage + '/' + $scope.currenttype;
        } else {
            $scope.url = 'vendor/product/get/paginate/' + $scope.Id + '/' + $scope.totalPerPage + '/' + $scope.currenttype;
        }
        $scope.getResultsPage();
    }

    $scope.sortBlogs = function(key) {
        $scope.searchData.sortkey = key;
        if ($scope.searchData.sortorder == '') {
            $scope.searchData.sortorder = 'asc';
        } else if ($scope.searchData.sortorder == 'asc') {
            $scope.searchData.sortorder = 'desc';
        } else {
            $scope.searchData.sortorder = '';
        }
        $scope.getBlogs();
    }

    $scope.sortVIPS = function(key) {
        $scope.searchData.sortkey = key;
        if ($scope.searchData.sortorder == '') {
            $scope.searchData.sortorder = 'asc';
        } else if ($scope.searchData.sortorder == 'asc') {
            $scope.searchData.sortorder = 'desc';
        } else {
            $scope.searchData.sortorder = '';
        }
        $scope.getVips();
    }

    $scope.sortCustomers = function(key) {
        $scope.searchData.sortkey = key;
        if ($scope.searchData.sortorder == '') {
            $scope.searchData.sortorder = 'asc';
        } else if ($scope.searchData.sortorder == 'asc') {
            $scope.searchData.sortorder = 'desc';
        } else {
            $scope.searchData.sortorder = '';
        }
        $scope.getCustomers();
    }

    $scope.search = function() {
        $scope.pagedata = [];
        $scope.pageno = 1;
        
        if ($scope.searchData.keyword.length > 0) {
            if ($scope.sortorder) {
                $scope.url = 'vendor/product/searchsort/' + $scope.Id + '/' + $scope.searchData.keyword + '/' + $scope.sortkey + '/' + $scope.sortorder + '/' + $scope.totalPerPage + '/' + $scope.currenttype;
            } else {
                $scope.url = 'vendor/product/search/' + $scope.Id + '/' + $scope.searchData.keyword + '/' + $scope.totalPerPage + '/' + $scope.currenttype;
            }
        } else {
            $scope.url = 'vendor/product/get/paginate/' + $scope.Id + '/' + $scope.totalPerPage + '/' + $scope.currenttype;
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
                $scope.products = getData.data;
            } else {
                $rootScope.logout();
            }
        });
    }


    $scope.deleteData = function(value) {

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
                    webServices.delete('vendor/timelinefile/delete/' + value.id).then(function(getData) {
                        if (getData.status == 200) {
                            $scope.getData();
                        } else {
                            $rootScope.$emit("showISError", getData);
                        }
                    });
                }
            });
    }

    $scope.events = [];

     $scope.changeView = function(view){
        $scope.calendarView = view;
        if(view == 'month'){
            $scope.getMonthData($scope.viewDate);
        }else if(view =='day'){
            $scope.getDayData($scope.viewDate);
        }
    }

    $scope.deleteBranch = function(value) {
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
                    webServices.delete('vendor/branch/delete/' + value.id).then(function(getData) {
                        if (getData.status == 200) {
                            $scope.getData();
                        } else {
                            $rootScope.$emit("showISError", getData);
                        }
                    });
                }
            });
    }

    $scope.deleteBlog = function(value) {
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
                    webServices.delete('blog/delete/' + value.id).then(function(getData) {
                        if (getData.status == 200) {
                            $scope.getBlogs();
                        } else {
                            $rootScope.$emit("showISError", getData);
                        }
                    });
                }
            });
    }

    $scope.deleteMenu = function(value) {
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
                    webServices.delete('vendor/menu/delete/' + value.id).then(function(getData) {
                        if (getData.status == 200) {
                            $scope.getData();
                        } else {
                            $rootScope.$emit("showISError", getData);
                        }
                    });
                }
            });
    }

   $scope.dateClicked = function(date) {
        $scope.viewDate = new Date(date.fulldate);
        $scope.changeView('day');
        $scope.getDayData($scope.viewDate);
    }

    $scope.loadprevious = function() {
        if ($scope.calendarView == 'day') {
            $scope.viewDate.setDate($scope.viewDate.getDate() - 1, 1);
            $scope.getDayData($scope.viewDate);
        } else if ($scope.calendarView == 'month') {
            $scope.viewDate.setMonth($scope.viewDate.getMonth() - 1, 1);
            $scope.getMonthData($scope.viewDate);
        }
    }

    $scope.loadnext = function() {
        if ($scope.calendarView == 'day') {
            $scope.viewDate.setDate($scope.viewDate.getDate() + 1, 1);
            $scope.getDayData($scope.viewDate);
        } else if ($scope.calendarView == 'month') {
            $scope.viewDate.setMonth($scope.viewDate.getMonth() + 1, 1);
            $scope.getMonthData($scope.viewDate);
        }
    }

    $scope.deleteProduct = function(value) {
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
                    webServices.delete('vendor/product/delete/' + value.id).then(function(getData) {
                        if (getData.status == 200) {
                            $scope.getVendorproducts();
                        } else {
                            $rootScope.$emit("showISError", getData);
                        }
                    });
                }
            });
    }

    $scope.deleteprotimefile = function(key) {
        if (!$scope.proData.timeline_files[key].isfile) {
            $scope.proData.deletedfiles.push($scope.proData.timeline_files[key]);
        }
        $scope.proData.timeline_files.splice(key, 1);
    }

    $scope.deleteblogfile = function(key) {
        if (!$scope.blogData.timeline_files[key].isfile) {
            $scope.blogData.deletedfiles.push($scope.blogData.timeline_files[key]);
        }
        $scope.blogData.timeline_files.splice(key, 1);
    }

    $scope.deletetimelinefile = function(key) {
        if (!$scope.timelineData.timeline_files[key].isfile) {
            $scope.timelineData.deletedfiles.push($scope.timelineData.timeline_files[key]);
        }
        $scope.timelineData.timeline_files.splice(key, 1);
    }

    $scope.addproducttimelineFile = function(files) {
        $scope.errors = [];
        if ($scope.proData.timeline_files.length < $rootScope.maxUploadFiles) {
            if (files && files.length) {
                if (($rootScope.maxUploadFiles - $scope.proData.timeline_files.length) >= files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var extn = files[i].name.split(".").pop();
                        if ($rootScope.validextensions.includes(extn.toLowerCase())) {
                            if (files[i].size <= $rootScope.maxUploadsize) {
                                var newobj = {};
                                newobj.file = files[i];
                                newobj.filename = files[i].name;
                                newobj.filetype = files[i].type.split("/")[0];
                                newobj.isfile = 1;
                                $scope.proData.timeline_files.push(newobj);
                            } else {
                                $scope.errors.push(files[i].name + ' size exceeds 2MB.')
                            }
                        } else {
                            $scope.errors.push(files[i].name + ' format unsupported.');
                        }
                    }
                } else {
                    $scope.errors.push('You can now upload only ' + ($rootScope.maxUploadFiles - $scope.proData.timeline_files.length) + ' files');
                }

            }
        } else {
            $scope.errors.push('You can add only maximum of ' + $rootScope.maxUploadFiles + ' files only');
        }
        if ($scope.errors.length > 0) {
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.addvendortimelineFile = function(files) {
        $scope.errors = [];
        if ($scope.timelineData.timeline_files.length < $rootScope.maxUploadFiles) {
            if (files && files.length) {
                if (($rootScope.maxUploadFiles - $scope.timelineData.timeline_files.length) >= files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var extn = files[i].name.split(".").pop();
                        if ($rootScope.validextensions.includes(extn.toLowerCase())) {
                            if (files[i].size <= $rootScope.maxUploadsize) {
                                var newobj = {};
                                newobj.file = files[i];
                                newobj.filename = files[i].name;
                                newobj.filetype = files[i].type.split("/")[0];
                                newobj.isfile = 1;
                                $scope.timelineData.timeline_files.push(newobj);
                            } else {
                                $scope.errors.push(files[i].name + ' size exceeds 2MB.')
                            }
                        } else {
                            $scope.errors.push(files[i].name + ' format unsupported.');
                        }
                    }
                } else {
                    $scope.errors.push('You can now upload only ' + ($rootScope.maxUploadFiles - $scope.timelineData.timeline_files.length) + ' files');
                }

            }
        } else {
            $scope.errors.push('You can add only maximum of ' + $rootScope.maxUploadFiles + ' files only');
        }
        if ($scope.errors.length > 0) {
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

     $scope.addblogFiles = function(files) {
        $scope.errors = [];
        if ($scope.blogData.timeline_files.length < $rootScope.maxUploadFiles) {
            if (files && files.length) {
                if (($rootScope.maxUploadFiles - $scope.blogData.timeline_files.length) >= files.length) {
                    for (var i = 0; i < files.length; i++) {
                        var extn = files[i].name.split(".").pop();
                        if ($rootScope.validextensions.includes(extn.toLowerCase())) {
                            if (files[i].size <= $rootScope.maxUploadsize) {
                                var newobj = {};
                                newobj.file = files[i];
                                newobj.filename = files[i].name;
                                newobj.filetype = files[i].type.split("/")[0];
                                newobj.isfile = 1;
                                $scope.blogData.timeline_files.push(newobj);
                            } else {
                                $scope.errors.push(files[i].name + ' size exceeds 2MB.')
                            }
                        } else {
                            $scope.errors.push(files[i].name + ' format unsupported.');
                        }
                    }
                } else {
                    $scope.errors.push('You can now upload only ' + ($rootScope.maxUploadFiles - $scope.blogData.timeline_files.length) + ' files');
                }

            }
        } else {
            $scope.errors.push('You can add only maximum of ' + $rootScope.maxUploadFiles + ' files only');
        }
        if ($scope.errors.length > 0) {
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }


    $scope.changeEmployeeStatus = function(data) {
        webServices.put('employee/updatestatus/' + data.id + '/' + data.status).then(function(getData) {
            if (getData.status == 200) {
                //$scope.employees.data[key].status = status;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }


    $scope.changeBlogStatus = function(data) {
        webServices.put('blog/updatestatus/' + data.id + '/' + data.status).then(function(getData) {
            if (getData.status == 200) {
                //$scope.employees.data[key].status = status;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }


    $scope.deleteEmployee = function(value) {
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
                    webServices.delete('employee/delete/' + value.id).then(function(getData) {
                        if (getData.status == 200) {
                            $scope.getData();
                        } else {
                            $rootScope.$emit("showISError", getData);
                        }
                    });
                }
            });
    }

    $scope.getData = function() {
        webServices.get('vendor/show/' + $scope.Id).then(function(getData) {
            if (getData.status == 200) {
                $scope.formData = getData.data;
                $scope.timelineData = getData.data.timeline;
                if ($scope.timelineData == null) {
                    $scope.timelineData = {};
                    $scope.timelineData.timeline_files = [];
                }
                $scope.timelineData.deletedfiles = [];
                
                angular.forEach($scope.categories, function(category, no) {
                    angular.forEach(category.subcategories, function(subcategory, key) {
                        angular.forEach($scope.formData.selected_sub_categories, function(added) {
                            if (subcategory.id == added.id) {
                                category.added_subcategories ++;
                            }
                        });
                    });
                });

                console.log($scope.categories)
                
        
                /*angular.forEach($scope.parentcategories, function(parent, no) {
                    angular.forEach($scope.formData.selected_categories, function(added, key) {
                        if (added == parent.id) {
                            parent.isadded = 1;
                        }
                    });
                });

                angular.forEach($scope.childrencategories, function(parent , no) {
                    angular.forEach(parent.subcategories, function(subcategory, key) {
                        console.log(subcategory)
                        angular.forEach($scope.formData.selected_sub_categories, function(added) {
                            console.log(added)
                            if (added == subcategory.id) {
                                subcategory.isadded = 1;
                                parent.added_subcategories ++;
                            }
                        });
                    });
                });*/
                $rootScope.loading = false;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.editProduct = function(data) {
        $scope.inputchange();
        $timeout(function() {
            $scope.proData = {};
            $scope.proData = data;
            $scope.proData.deletedfiles = [];
            $scope.vendorbranches = angular.copy($scope.branches);
            console.log($scope.vendorbranches)
            $scope.activekey = 1;
            $scope.addedbranches = [];
            angular.forEach($scope.vendorbranches, function(branch, no) {
                angular.forEach($scope.proData.branches, function(innerbranch, key) {
                    if (innerbranch.branch_id == branch.id) {
                        branch.is_added = 1;
                        $scope.addedbranches.push(branch.id);
                    }
                });
            });
            $scope.gettypeCategory($scope.proData.type);
            $scope.getBranchEmployees();
            $scope.isedit = 1;
            $rootScope.modalerrors = [];
            $('#ProductModal').modal({
                backdrop: 'static',
                keyboard: false
            });
        }, 1000);
    };

    $scope.editBranch = function(data) {
        $scope.inputchange();
        $timeout(function() {
            $scope.branchData = {};
            $scope.branchData = data;
            $scope.isedit = 1;
            $rootScope.modalerrors = [];
            $('#BranchModal').modal({
                backdrop: 'static',
                keyboard: false
            });
        }, 1000);
    };

    $scope.editBlog = function(data) {
        $scope.inputchange();
        $timeout(function() {
            $scope.blogData = {};
            $scope.blogData = data;
            $scope.blogData.deletedfiles = [];
            $scope.isedit = 1;
            $rootScope.modalerrors = [];
            $('#BlogModal').modal({
                backdrop: 'static',
                keyboard: false
            });
        }, 1000);
    };

    $scope.editMenu = function(data) {
        $scope.inputchange();
        $timeout(function() {
            $scope.menuData = {};
            $scope.menuData = data;
            $scope.isedit = 1;
            $rootScope.modalerrors = [];
            $('#MenuModal').modal({
                backdrop: 'static',
                keyboard: false
            });
        }, 1000);
    };

    $scope.editEmployee = function(data) {
        $scope.inputchange();
        $timeout(function() {
            $scope.employeeData = {};
            $scope.employeeData = data;
            if ($scope.employeeData.dob) {
                $scope.employeeData.dateofbirth = $filter('date')(new Date($scope.employeeData.dob), 'dd-MMMM-yyyy');
            }
            $scope.isedit = 1;
            $rootScope.modalerrors = [];
            $('#EmployeeModal').modal({
                backdrop: 'static',
                keyboard: false
            });
            $('.bootstrap-filestyle input[type="text"]').val('');
        }, 1000);
    };

    $scope.changetab = function(tab) {
        $scope.pagedata = [];
        $scope.pageno = 1;
        $scope.totalData = 0;
        $scope.totalPerPage = $rootScope.pagelimits[0];
        $scope.searchData = {};
        $scope.productData = {};
        $scope.proData = {};

        $scope.popup_pagedata = [];
        $scope.popup_pageno = 1;
        if (tab != $scope.activetab) {
            $scope.activetab = tab;
            if ($scope.activetab == 'services') {
                $scope.getBranches();
                $scope.searchData = {};
                $rootScope.loading = true;
                $scope.products = [];
                $scope.pagedata = [];
                $scope.searchData.keyword = '';
                $scope.currenttype = 'all';
                $scope.sortorder = '';
                $scope.activevendor = '';
                $scope.getVendorproducts();
            }else if ($scope.activetab == 'employees' || $scope.activetab == 'services') {
                $scope.getBranches();
            }else if ($scope.activetab == 'calendar') {
                $scope.calendarView = 'month';
                $scope.viewDate = new Date();
                $scope.today = new Date();
                $scope.activemonth = new Date().getMonth();
                $scope.activeyear = new Date().getFullYear();
                $scope.selectedmonth = new Date().getMonth();
                $scope.selectedyear = new Date().getFullYear();
                $scope.selected = {};
                $scope.getServices();
            }else if ($scope.activetab == 'customers') {
                $scope.searchData.popup_totalPerPage = $rootScope.pagelimits[0];
                $scope.searchData.vendor = $scope.Id;
                $scope.searchData.sortkey = '';
                $scope.searchData.sortorder = '';
                $scope.searchData.gender = '';
                $scope.getCustomers();
            }else if ($scope.activetab == 'vips') {
                $scope.searchData.popup_totalPerPage = $rootScope.pagelimits[0];
                $scope.searchData.vendor = $scope.Id;
                $scope.searchData.sortkey = '';
                $scope.searchData.sortorder = '';
                $scope.searchData.gender = '';
                $scope.getVips();
            }else if ($scope.activetab == 'blog') {
                $scope.searchData.popup_totalPerPage = $rootScope.pagelimits[0];
                $scope.searchData.vendor = $scope.Id;
                $scope.searchData.sortkey = '';
                $scope.searchData.sortorder = '';
                $scope.getBlogs();
            }
        }
    }

    $scope.getCustomers = function() {
        webServices.post('vendor/customers/' + $scope.searchData.popup_totalPerPage + '?page=' + $scope.popup_pageno,$scope.searchData).then(function(getData) {
            $rootScope.loading = false;
            console.log(getData)
            if (getData.status == 200) {
                 $scope.popup_pagination = {
                    current: $scope.popup_pageno
                };
                $scope.popup_pagedata[$scope.popup_pageno] = getData.data;
                $scope.customers = getData.data;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.popup_pageChanged = function(newPage) {
        $scope.popup_pageno = newPage;
        if(!$scope.popup_pagedata[$scope.popup_pageno]){
            if($scope.activetab == 'customers'){
                $scope.getCustomers();
            }else if($scope.activetab == 'vips'){
                $scope.getVips();
            }   
        }else{
            if($scope.activetab == 'customers'){
                $scope.customers = $scope.popup_pagedata[$scope.popup_pageno];
            }else if($scope.activetab == 'vips'){
                $scope.vips = $scope.popup_pagedata[$scope.popup_pageno];
            }   
        }
    }

    $scope.getVips = function() {
        webServices.post('vendor/vips/' + $scope.searchData.popup_totalPerPage + '?page=' + $scope.popup_pageno,$scope.searchData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.popup_pagination = {
                    current: $scope.popup_pageno
                };
                $scope.popup_pagedata[$scope.popup_pageno] = getData.data;
                $scope.vips = getData.data;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.getBlogs = function() {
        webServices.post('blog/get/paginate/' + $scope.totalPerPage + '?page=' + $scope.pageno,$scope.searchData).then(function(getData) {
            $rootScope.loading = false;
            console.log(getData)
            if (getData.status == 200) {
                $scope.pagination = {
                    current: $scope.pageno
                };
                $scope.pagedata[$scope.pageno] = getData.data;
                $scope.blogs = getData.data;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.getServices = function() {
        webServices.get('vendor/services/get/' + $scope.Id).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.services = getData.data;
                $scope.getBranches();
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.changeBranch = function(){
        if($scope.calendarView == 'month'){
            $scope.getMonthData($scope.viewDate);
        }else if($scope.calendarView == 'month'){
            $scope.getDayData($scope.viewDate);
        }
    }

    $scope.getMonthData = function(date){
        webServices.get('timeslot/monthData/'+ $scope.Id + '/' + $scope.selected.service.id + '/' + $scope.selected.branch + '/' + date.getTime()).then(function(getData) {
            $rootScope.loading = false;
            console.log(getData)
            if (getData.status == 200) {
                 $scope.calendarMonthData = getData.data.data;
                $scope.monthInfo = {};
                $scope.monthInfo.text_left = '';
                $scope.monthInfo.text_right = '';
                if(getData.data.monthinfo){
                    $scope.monthInfo = getData.data.monthinfo;
                }
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.getDayData = function(date){
        webServices.get('timeslot/dailyData/'+ $scope.Id + '/' + $scope.selected.service.id + '/' + $scope.selected.branch + '/' + date.getTime()).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.calendarDayData = getData.data;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }


    $scope.viewOrder = function(order){
        $scope.orderurl = '';
        $scope.orderData = {};
        $scope.orderData = order;
        $scope.orderData.istoday = 0;
        $scope.orderData.isgreaterstart = 0;
        $scope.orderData.islesserend = 0;
        var today = $filter('date')(new Date(), 'yyyy-MM-dd');
        if(order.slotinfo.date == today){
            $scope.orderData.istoday = 1;
        }if(new Date(order.slotinfo.started_at) >= new Date()){
            $scope.orderData.isgreaterstart = 1;
        }if(new Date(order.slotinfo.endeded_at) <= new Date()){
            $scope.orderData.islesserend = 1;
        }
        console.log($scope.orderData)
        $('#OrderModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.attendOrder = function(){
        SweetAlert.swal({
                title: "Are you sure?",
                text: "You want to proceed to attend!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#27c24c",
                confirmButtonText: "Proceed",
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function(isConfirm) {
                if (isConfirm) {
                    $scope.detailData = {};
                    $scope.detailData.order_id = $scope.orderData.id;
                    $scope.detailData.status = 1;
                    $scope.detailData.comments = 'Order attended';
                    $scope.orderurl = 'order/attend/';
                    $scope.updateOrderdetail();
                }
            });
    }

    $scope.cancelOrder = function(){
        SweetAlert.swal({
                title: "Are you sure?",
                text: "You want to proceed to cancel!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#27c24c",
                confirmButtonText: "Proceed",
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function(isConfirm) {
                if (isConfirm) {
                    $scope.detailData = {};
                    $scope.detailData.order_id = $scope.orderData.id;
                    $scope.detailData.comments = 'Order Cancelled';
                    $scope.detailData.status = 4;
                    $scope.orderurl = 'order/cancel/';
                    $scope.updateOrderdetail();
                }
            });
    }

    $scope.completeOrder = function(){
        SweetAlert.swal({
                title: "Are you sure?",
                text: "You want to proceed to complete!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#27c24c",
                confirmButtonText: "Proceed",
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function(isConfirm) {
                if (isConfirm) {
                    $scope.detailData = {};
                    $scope.detailData.order_id = $scope.orderData.id;
                    $scope.detailData.comments = 'Order Completed';
                    $scope.detailData.status = 2;
                    $scope.orderurl = 'order/complete/';
                    $scope.updateOrderdetail();
                }
            });
    }

    $scope.delayOrder = function(time){
        SweetAlert.swal({
                title: "Are you sure?",
                text: "You want to proceed to delay!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Proceed!",
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function(isConfirm) {
                if (isConfirm) {
                    $scope.detailData = {};
                    $scope.detailData.order_id = $scope.orderData.id;
                    $scope.detailData.comments = 'Order delayed';
                    $scope.detailData.time = time;
                    $scope.orderurl = 'order/delay/';
                    $scope.updateOrderdetail();
                }
            });
    }

    $scope.extendOrder = function(time){
        SweetAlert.swal({
                title: "Are you sure?",
                text: "You want to proceed to cancel!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function(isConfirm) {
                if (isConfirm) {
                    $scope.detailData = {};
                    $scope.detailData.order_id = $scope.orderData.id;
                    $scope.detailData.comments = 'Order extended';
                    $scope.detailData.time = time;
                    $scope.orderurl = 'order/extend/';
                    $scope.updateOrderdetail();
                }
            });
    }

    $scope.updateOrderdetail = function(){
        webServices.post($scope.orderurl + $scope.orderData.id, $scope.detailData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.orderData.status = $scope.detailData.status;
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
    }

    $scope.getServiceBranches = function() {
        webServices.get('vendor/servicebranches/' + $scope.selected.service.id).then(function(getData) {
            if (getData.status == 200) {
                $scope.selected.branch = '';
                $scope.servicebranches = getData.data;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.addremoveproductbranch = function(id, status) {
        if (status) {
            var obj = {};
            obj.branch_id = id;
            $scope.addedbranches.push(id);
            $scope.proData.branches.push(obj);
        } else {
            var index = array.indexOf(id);
            if (index !== -1) $scope.addedbranches.splice(index, 1);
            angular.forEach($scope.proData.branches, function(branch, no) {
                if (branch.branch_id == id) {
                    $scope.proData.branches.splice(no, 1);
                }
            });
        }
        $scope.getBranchEmployees();
        console.log($scope.proData.branches)
    }

    $scope.addremovebranchemployee = function(id, status) {
        if (status) {
            var obj = {};
            obj.employee_id = id;
            $scope.proData.employees.push(obj);
        } else {
            angular.forEach($scope.proData.employees, function(employee, no) {
                if (employee.employee_id == id) {
                    $scope.proData.employees.splice(no, 1);
                }
            });
        }
        console.log($scope.proData.employees)
    }

    $scope.getBranches = function() {
        webServices.get('vendor/branch/get/all/' + $scope.Id).then(function(getData) {
            if (getData.status == 200) {
                $scope.branches = getData.data;
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.openLightboxModal = function(key) {
        $scope.images = [];
        angular.forEach($scope.timelineData.timelinefiles, function(media, no) {
            var obj = {};
            obj.isVideo = 0;
            if (media.filetype == 'video') {
                obj.type = 'video';
                obj.isVideo = 1;
                obj.isSharedVideo = 0;
            }
            obj.url = $rootScope.IMGURL + media.file;
            obj.thumbUrl = $rootScope.IMGURL + media.thumbnail;
            $scope.images.push(obj);
        });
        Lightbox.openModal($scope.images, key);
    };

    $scope.editProfile = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            webServices.putupload('vendor/edit/' + $scope.Id, $scope.formData).then(function(getData) {
                $rootScope.loading = false;
                if (getData.status == 200) {
                    $rootScope.$emit("showSuccessMsg", getData.data.message);
                    $scope.getData();
                } else if (getData.status == 401) {
                    $scope.errors = utility.getError(getData.data.message);
                    $rootScope.loading = false;
                    $rootScope.$emit("showErrors", $scope.errors);
                } else {
                    $rootScope.$emit("showISError", getData);
                }
            });
        } else {
            if (!form.company_name.$valid) {
                $scope.errors.push('Please enter company name');
            }
            if (!form.email.$valid) {
                $scope.errors.push('Please enter valid email');
            }
            if (!form.phone_number.$valid) {
                $scope.errors.push('Please enter phone number');
            }
            /*if (!form.uen_number.$valid) {
                            $scope.errors.push('Please enter UEN number');
                        }if (!form.gst_number.$valid) {
                            $scope.errors.push('Please enter GST number');
                        }*/
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    /*$scope.addremovemainCategory = function(key,category) {
        if(category.isadded){
            category.isadded = 0;
            var index = $scope.formData.selected_categories.indexOf(category.id);
            if (index !== -1) $scope.formData.selected_categories.splice(index, 1);
        }else{
            $scope.formData.selected_categories.push(category.id);
            category.isadded = 1;
        }
    };


    $scope.addremovesubCategory = function(category,subcategory) {
        if(subcategory.isadded){
            category.added_subcategories --;
            subcategory.isadded = 0;
            var index = $scope.formData.selected_sub_categories.indexOf(subcategory.id);
            if (index !== -1) $scope.formData.selected_sub_categories.splice(index, 1);
        }else{
            category.added_subcategories ++;
            $scope.formData.selected_sub_categories.push(subcategory.id);
            subcategory.isadded = 1;
        }
    };
*/

     $scope.addcategory = function() {
        if ($scope.subcategories.length == 0) {
            if ($scope.checkcategory($scope.selected.category.id)) {
                if($scope.formData.selected_categories.length < 3){
                    $scope.formData.selected_categories.push($scope.selected.category);
                }
            }
        } else {
            if ($scope.checksubcategory($scope.selected.subcategory.id)) {
                if($scope.selected.category.added_subcategories < 3){
                    $scope.selected.category.added_subcategories ++;
                    $scope.formData.selected_sub_categories.push($scope.selected.subcategory);
                }
            }
        }
    };

    $scope.changemaincat = function(category) {
        $scope.subcategories = [];
        $scope.subcategories = category.subcategories;
    }


    $scope.removemaincategory = function(key) {
        $scope.formData.selected_categories.splice(key, 1);
    }

    $scope.addvendorcatsub = function(subcategory) {
        if ($scope.checksubcategory(subcategory.id)) {
            $scope.formData.selected_sub_categories.push(subcategory);
        }
    };

    $scope.removesubcategory = function(key,subcategory) {
        
        angular.forEach($scope.categories, function(category, no) {
            if(subcategory.category.id == category.id){
                $scope.selected.category.added_subcategories --;
            }
        });
        $scope.formData.selected_sub_categories.splice(key, 1);
    }

    $scope.checkcategory = function(category) {
        var status = true;
        angular.forEach($scope.formData.selected_categories, function(data, no) {
            if (data.id == category) {
                status = false;
            }
        });

        return status;
    }

    $scope.checksubcategory = function(category) {
        var status = true;
        angular.forEach($scope.formData.selected_sub_categories, function(data, no) {
            if (data.id == category) {
                status = false;
            }
        });

        return status;
    }
    
    $scope.getLatandLong = function(zipcode) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            'address': zipcode
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                $scope.branchData.latitude = results[0].geometry.location.lat();
                $scope.branchData.longitude = results[0].geometry.location.lng();
            } else {
                $scope.branchData.latitude = 0;
                $scope.branchData.longitude = 0;
            }
            console.log($scope.branchData)
        });
    }

    $scope.removebranch = function(key) {
        $scope.formData.branches.splice(key, 1);
    }

    $scope.closeModal = function() {
        $scope.fileData = {};
        $scope.branchData = {};
        $scope.employeeData = {};
        $scope.proData = {};
        $scope.slotData = {};
        $scope.copyData = {};
        $scope.menuData = {};
        $scope.blogData = {};
        $scope.isedit = 0;
        $('#BranchModal').modal('hide');
        $('#EmployeeModal').modal('hide');
        $('#ProductModal').modal('hide');
        $('#SlotModal').modal('hide');
        $('#CopyModal').modal('hide');
        $('#MenuModal').modal('hide');
        $('#OrderModal').modal('hide');
        $('#BlogModal').modal('hide');

        $rootScope.modalerrors = [];
    }

    $scope.addTimelineFile = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            if (!$scope.isedit) {
                webServices.upload('vendor/timelinefile/add/' + $scope.Id, $scope.fileData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getData();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            } else {
                webServices.putupload('vendor/timelinefile/edit/' + $scope.fileData.id, $scope.fileData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getData();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            }
        } else {
            if (!form.newthumbnail.$valid) {
                $scope.errors.push('Please upload thumbnail');
            }
            if (!form.newfile.$valid) {
                $scope.errors.push('Please upload file');
            }
            $rootScope.$emit("showModalErrors", $scope.errors);
        }
    }

    
    $scope.addSlot = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            $scope.postData = {};
            $scope.postData.service = $scope.selected.service.id;
            $scope.postData.vendor = $scope.Id;
            $scope.postData.branch = $scope.selected.branch;
            $scope.postData.date = $filter('date')($scope.viewDate, 'yyyy-MM-dd');
            $scope.postData.started_at = $filter('date')($scope.slotData.starttime, 'yyyy-MM-dd HH:mm:ss');
            $scope.postData.ended_at = $filter('date')($scope.slotData.endtime, 'yyyy-MM-dd HH:mm:ss');
            $scope.postData.employees = $scope.slotData.employees;
            $scope.postData.slotgap = $scope.slotData.slotgap;
            $scope.postData.singleslot = $scope.slotData.singleslot;
            if (!$scope.isedit) {
                if ($scope.slotData.singleslot) {
                    $scope.addtimeslots();
                } else {
                    $scope.checkslots();
                }
            } else {
                webServices.put('timeslot/edit/' + $scope.slotData.id, $scope.postData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.getDayData($scope.viewDate);
                        $scope.closeModal();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            }
        } else {
            $rootScope.$emit("showModalErrors", $scope.errors);
        }
    }

    $scope.addtimeslots = function() {
        webServices.post('timeslot/add', $scope.postData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.getDayData($scope.viewDate);
                $scope.closeModal();
            } else if (getData.status == 401) {
                $scope.errors = utility.getError(getData.data.message);
                $rootScope.$emit("showModalErrors", $scope.errors);
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.checkslots = function(){
        webServices.post('timeslot/check', $scope.postData).then(function(getData) {
                $rootScope.loading = false;
                if (getData.status == 200) {
                   if(getData.data.data == 0){
                        $scope.addtimeslots();
                   }else{
                        SweetAlert.swal({
                            title: "Some slots already Available",
                            text: "Those will be removed.",
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Yes, Proceed!",
                            closeOnConfirm: true,
                            closeOnCancel: true
                        },
                        function(isConfirm) {
                            if (isConfirm) {
                                $scope.addtimeslots();
                            }
                        });
                    }
                } else if (getData.status == 401) {
                    $scope.errors = utility.getError(getData.data.message);
                    $rootScope.$emit("showModalErrors", $scope.errors);
                } else {
                    $rootScope.$emit("showISError", getData);
                }
        });
    }

    $scope.addBranch = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            if (!$scope.isedit) {
                webServices.upload('vendor/branch/add/' + $scope.Id, $scope.branchData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getData();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            } else {
                webServices.putupload('vendor/branch/edit/' + $scope.branchData.id, $scope.branchData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getData();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            }
        } else {
            if (!form.address.$valid) {
                $scope.errors.push('Please enter branch address');
            }if (!form.website.$valid) {
                $scope.errors.push('Please enter valid website url');
            }if (!form.email.$valid) {
                $scope.errors.push('Please enter branch email');
            }if (!form.phonenumber.$valid) {
                $scope.errors.push('Please enter branch phone number');
            }if (!form.postal_code.$valid) {
                $scope.errors.push('Please enter branch postal code');
            }if (!form.branch_name.$valid) {
                $scope.errors.push('Please enter branch Name');
            }

            $rootScope.$emit("showModalErrors", $scope.errors);
        }
    }

    $scope.addMenu = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            if (!$scope.isedit) {
                webServices.upload('vendor/menu/add/' + $scope.Id, $scope.menuData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $('#MenuModal').modal('hide');
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getData();
                        $scope.isedit = false;
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            } else {
                webServices.putupload('vendor/menu/edit/' + $scope.menuData.id, $scope.menuData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $('#MenuModal').modal('hide');
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getData();
                        $scope.isedit = false;
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            }
        } else {
            if (!form.menu.$valid) {
                $scope.errors.push('Please enter menu name');
            }
            if (!form.type.$valid) {
                $scope.errors.push('Please select menu type');
            }

            $rootScope.$emit("showModalErrors", $scope.errors);
        }
    }

    $scope.addEmployee = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            if (!$scope.isedit) {
                webServices.upload('employee/add', $scope.employeeData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getData();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            } else {
                webServices.putupload('employee/edit/' + $scope.employeeData.id, $scope.employeeData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getData();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            }
        } else {
            if (!form.nationality.$valid) {
                $scope.errors.push('Please choose employee nationality');
            }
            if (!form.employee_name.$valid) {
                $scope.errors.push('Please enter employee name');
            }
            $rootScope.$emit("showModalErrors", $scope.errors);
        }
    }

    $scope.addBlog = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            if (!$scope.isedit) {
                console.log($scope.blogData)
                webServices.upload('blog/add', $scope.blogData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getBlogs();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            } else {
                webServices.putupload('blog/edit/' + $scope.blogData.id, $scope.blogData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getBlogs();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            }
        } else {
            if (!form.title.$valid) {
                $scope.errors.push('Please enter blog title');
            }if (!form.type.$valid) {
                $scope.errors.push('Please select blog type');
            }if (!form.link.$valid) {
                $scope.errors.push('Please enter blog link');
            }if (!form.description.$valid) {
                $scope.errors.push('Please enter blog description');
            }if (!form.images.$valid) {
                $scope.errors.push('Please upload blog images');
            }
            $rootScope.$emit("showModalErrors", $scope.errors);
        }
    }

    $scope.addProduct = function(form) {
        $scope.errors = [];
        $scope.firststep = true;
        if (form.$valid) {

            $rootScope.loading = true;
            if (!$scope.isedit) {
                webServices.upload('vendor/product/add', $scope.proData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getVendorproducts();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            } else {
                webServices.putupload('vendor/product/edit/' + $scope.proData.id, $scope.proData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.getVendorproducts();
                    } else if (getData.status == 401) {
                        $scope.errors = utility.getError(getData.data.message);
                        $rootScope.$emit("showModalErrors", $scope.errors);
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            }
        } else {

            if (!form.category.$valid) {
                $scope.firststep = false;
                $scope.errors.push('Please choose product category');
            }if (!form.price.$valid) {
                $scope.firststep = false;
                $scope.errors.push('Please enter product price');
            }if (!form.offer_price.$valid) {
                $scope.firststep = false;
                $scope.errors.push('Please enter product offer price');
            }if (!form.description1.$valid) {
                $scope.errors.push('Please enter description');
                $scope.firststep = false;
            }if (!form.title.$valid) {
                $scope.errors.push('Please enter title');
                $scope.firststep = false;
            }if (!form.timeline_files.$valid) {
                $scope.errors.push('Please upload timeline files');
                if ($scope.firststep) {
                    $scope.activekey = 2;
                }
            }

            if (!form.branches.$valid) {
                $scope.errors.push('Please choose branches for this service');
                if ($scope.firststep) {
                    $scope.activekey = 3;
                }
            }

            if (!form.employees.$valid) {
                $scope.errors.push('Please assign employees for this service');
                if ($scope.firststep) {
                    $scope.activekey = 3;
                }
            }
            $rootScope.$emit("showModalErrors", $scope.errors);
        }
    }

    $scope.editTimeline = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $scope.updateData();
        } else {
            if (!form.files.$valid) {
                $scope.errors.push('Please upload timeline files');
            }if (!form.flash_notice.$valid) {
                $scope.errors.push('Please enter flash notice');
            }if (!form.description.$valid) {
                $scope.errors.push('Please enter description');
            }if (!form.title.$valid) {
                $scope.errors.push('Please enter timeline title');
            }
            $rootScope.$emit("showErrors", $scope.errors);
        }
    }

    $scope.updateData = function() {
        $rootScope.loading = true;
        webServices.putupload('vendor/timeline/' + $scope.Id, $scope.timelineData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $scope.getData();
            } else if (getData.status == 401) {
                $scope.errors = utility.getError(getData.data.message);
                $rootScope.loading = false;
                $rootScope.$emit("showErrors", $scope.errors);
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    /*$scope.getCategories = function() {
        webServices.get('vendor/profile/categories').then(function(getData) {
            console.log(getData)
            if (getData.status == 200) {
                $scope.parentcategories = getData.data.without_children_categories;
                $scope.childrencategories = getData.data.with_children_categories;
                $scope.getData();
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }*/

    $scope.getCategories = function() {
        webServices.get('category/get/all').then(function(getData) {
            if (getData.status == 200) {
                $scope.categories = getData.data;
                $scope.getData();
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.openbranchModal = function() {
        $scope.inputchange();
        $scope.branchData = {};
        $scope.isedit = 0;
        $rootScope.modalerrors = [];
        //$scope.setWorkingDays();
        $('#BranchModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.openblogModal = function() {
        $scope.inputchange();
        $scope.blogData = {};
        $scope.blogData.vendor = $scope.Id;
        $scope.blogData.timeline_files = [];
        $scope.isedit = 0;
        $rootScope.modalerrors = [];
        $('#BlogModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.openslotModal = function() {
        $scope.inputchange();
        $scope.slotData = {};
        $scope.slotData.isopen = 1;
        $scope.slotData.starttime = $scope.roundMinutes($scope.selectedDate, 8, 0);
        $scope.slotData.endtime = $scope.roundMinutes($scope.selectedDate, 22, 0);
        $scope.isedit = 0;
        $scope.slotData.singleslot = 1;
        $scope.slotData.slotgap = '00:15';
        $scope.slotData.employees = $scope.selected.service.employees;
        angular.forEach($scope.slotData.employees, function(employee, key) {
            employee.status = '0';
        });

        $rootScope.modalerrors = [];
        $('#SlotModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.roundMinutes = function(date, hour, minute) {
        var newdate = new Date(date);
        newdate.setHours(hour);
        //date.setHours(date.getHours() + Math.round(date.getMinutes() / 60));
        newdate.setMinutes(minute);
        return newdate;
    }

    $scope.chanegmodaltab = function(key) {
        $scope.activekey = key;
    }

    $scope.changeSlotemployeestatus = function(key, status) {
        if (status != '1') {
            if (status == '0') {
                $scope.slotData.employees[key].status = '2';
            } else if (status == '2') {
                $scope.slotData.employees[key].status = '0';
            }
        }
    }

    $scope.openproductModal = function() {
        $scope.inputchange();
        $timeout(function() {
            $scope.proData = {};
            if($scope.currenttype == 'all'){
                $scope.proData.type = 'Product';
            }else{
                $scope.proData.type = $scope.currenttype;
            }
            $scope.proData.vendor = $scope.Id;
            $scope.proData.has_book = 0;
            $scope.addedbranches = [];
            $scope.proData.timeline_files = [];
            $scope.proData.branches = [];
            $scope.proData.employees = [];
            $scope.proData.isfile = '';
            $scope.proData.isbranch = '';
            $scope.proData.isemployee = '';
            $scope.vendorbranches = angular.copy($scope.branches);
            console.log($scope.vendorbranches)
            $scope.isedit = 0;
            $scope.activekey = 1;
            $rootScope.modalerrors = [];
            $scope.gettypeCategory($scope.proData.type);
            $('#ProductModal').modal({
                backdrop: 'static',
                keyboard: false
            });
        }, 1000);
    }

    $scope.openmenuModal = function() {
        $scope.inputchange();
        $scope.menuData = {};
        $scope.isedit = 0;
        $rootScope.modalerrors = [];
        $('#MenuModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.openemployeeModal = function() {
        $scope.inputchange();
        $timeout(function() {
            $scope.employeeData = {};
            $scope.employeeData.gender = $rootScope.genders[0];
            $scope.employeeData.experience = $rootScope.experiences[0];
            $scope.employeeData.vendor = $scope.Id;
            $scope.employeeData.experience = $rootScope.experiences[0];
            $scope.employeeData.price_per = $rootScope.pricingtypes[0];
            $scope.employeeData.work_type = 1;
            $scope.isedit = 0;
            $rootScope.modalerrors = [];
            $('#EmployeeModal').modal({
                backdrop: 'static',
                keyboard: false
            });
            $('.bootstrap-filestyle input[type="text"]').val('');
        }, 1000);

    }

    $scope.inputchange = function() {
        $scope.errors = [];
    }

    $scope.gettypeCategory = function(type) {
        webServices.get('vendor/menu/' + $scope.Id + '/' + type).then(function(getData) {
            if (getData.status == 200) {
                $scope.typecategories = getData.data;
                console.log($scope.typecategories)
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.getBranchEmployees = function(type) {
        $scope.branchemployees = [];
        if ($scope.addedbranches.length > 0) {
            webServices.get('employee/get/branch/' + $scope.addedbranches.toString()).then(function(getData) {
                if (getData.status == 200) {
                    $scope.branchemployees = getData.data;
                    if ($scope.isedit) {
                        angular.forEach($scope.branchemployees, function(employee, no) {
                            angular.forEach($scope.proData.employees, function(inneremployee, key) {
                                if (inneremployee.employee_id == employee.id) {
                                    employee.is_added = 1;
                                }
                            });
                        });
                    }
                } else {
                    $rootScope.$emit("showISError", getData);
                }
            });
        }
    }

    $scope.opencopyModal = function(data) {
        $scope.inputchange();
        $scope.copyData = {};
        $scope.copyData.date = data.fulldate;
        $scope.copyData.service = $scope.selected.service.id;
        $scope.copyData.branch = $scope.selected.branch;
        $scope.copyData.vendor = $scope.Id;
        $rootScope.modalerrors = [];
        var copymindate = new Date(angular.copy(data.fulldate));
        $scope.minimumDate = new Date(copymindate.setDate(copymindate.getDate() + 1));
        $('#CopyModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.clearSlots = function(data) {
        $scope.clearData = {};
        $scope.clearData.date = data.fulldate;
        $scope.clearData.service = $scope.selected.service.id;
        $scope.clearData.branch = $scope.selected.branch;
        $scope.clearData.vendor = $scope.Id;
        SweetAlert.swal({
                title: "Are You want to clear ?",
                text: "Those slots will be removed permenantly",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, Proceed!",
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function(isConfirm) {
                if (isConfirm) {
                    $scope.clearslotItems();
                }
            });
    }

    $scope.clearslotItems = function() {
        webServices.upload('timeslot/clear', $scope.clearData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.getMonthData($scope.viewDate);
                $rootScope.$emit("showSuccessMsg", getData.data.message);
            } else if (getData.status == 401) {
                $scope.errors = utility.getError(getData.data.message);
                $rootScope.$emit("showModalErrors", $scope.errors);
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.pickerdateOptions = {
        formatYear: 'yyyy',
        startingDay: 0,
        class: 'datepicker',
        showWeeks: false,
        minMode: 'day'
    };
    $scope.dateformat = 'dd-MM-yyyy';

    $scope.copySlotData = function(form) {
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            $scope.copyData.start_date = $filter('date')($scope.copyData.startdate, 'yyyy-MM-dd');
            if ($scope.copyData.enddate) {
                $scope.copyData.end_date = $filter('date')($scope.copyData.enddate, 'yyyy-MM-dd');
            }

            webServices.post('timeslot/checkcopy', $scope.copyData).then(function(getData) {
                $rootScope.loading = false;
                if (getData.status == 200) {
                   if(getData.data.data == 0){
                        $scope.copyslotitems();
                   }else{
                        SweetAlert.swal({
                            title: "Some slots already Available",
                            text: "Those will be removed.",
                            type: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Yes, Proceed!",
                            closeOnConfirm: true,
                            closeOnCancel: true
                        },
                        function(isConfirm) {
                            if (isConfirm) {
                                $scope.copyslotitems();
                            }
                        });
                    }
                } else if (getData.status == 401) {
                    $scope.errors = utility.getError(getData.data.message);
                    $rootScope.$emit("showModalErrors", $scope.errors);
                } else {
                    $rootScope.$emit("showISError", getData);
                }
        });
        } else {

            if (!form.startdate.$valid) {
                $scope.errors.push('Please select startdate');
                $scope.firststep = false;
            }
            $rootScope.$emit("showModalErrors", $scope.errors);
        }
    }

    $scope.copyslotitems = function() {
        webServices.upload('timeslot/copy', $scope.copyData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.getMonthData($scope.viewDate);
                $scope.closeModal();
                $rootScope.$emit("showSuccessMsg", getData.data.message);
            } else if (getData.status == 401) {
                $scope.errors = utility.getError(getData.data.message);
                $rootScope.$emit("showModalErrors", $scope.errors);
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.editSlotemployee = function(data, employee) {
        $scope.slotData = {};
        $scope.slotData = angular.copy(data);
        $scope.slotData.starttime = new Date(angular.copy($scope.slotData.started_at));
        $scope.slotData.endtime = new Date(angular.copy($scope.slotData.ended_at));
        $scope.slotData.employee_id = employee.employee_id;

        $scope.isedit = 1;
        console.log($scope.slotData)
        $scope.inputchange();
        $rootScope.modalerrors = [];
        $('#SlotModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }


    $rootScope.$on("copySlot", function() {
        $scope.opencopyModal();
    });

    $scope.getCategories();
}]);