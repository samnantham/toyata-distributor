'use strict';
app.controller('NotificationController', ['$scope', '$http', '$state', 'authServices', '$ngConfirm', 'webServices', 'utility', '$rootScope', '$timeout', 'toaster', function($scope, $http, $state, authServices, $ngConfirm, webServices, utility, $rootScope, $timeout, toaster) {

    $scope.pagedata = [];
    $scope.pageno = 1;
    $scope.totalData = 0;
    $scope.totalPerPage = $rootScope.pagelimits[0];
    $scope.notifications = [];
    
    $scope.getNotification = function() {
        webServices.get('notification/paginate/' + $scope.totalPerPage + '?page=' + $scope.pageno).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.pagination = {
                    current: $scope.pageno
                };
                $scope.pagedata[$scope.pageno] = getData.data;
                $scope.notifications = getData.data;
            } else {
                //authServices.logout();
            }
            $rootScope.loading = false;
        });
    }

    $scope.gotoNotification = function(key,data){
        if(!data.status){
            $scope.readNotification(key,data);
        }if(data.module == 2){
            $state.go('app.viewtbp',{'id':data.item});
        }else{
            $state.go('app.viewevent',{'id':data.item});
        }

    }

    $scope.readNotification = function(key,notification){
        webServices.put('notification/read/' + notification.id).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.notifications.data[key].status = 1;
                $scope.pagedata[$scope.pageno].data[key].status = 1;

            } else {
                //authServices.logout();
            }
            $rootScope.loading = false;
        });
    }

    $scope.removeNotification = function(key,notification){
        $ngConfirm({
            title: 'Are you sure want to delete this?',
            content: '',
            type: 'success',
            typeAnimated: true,
            buttons: {
                tryAgain: {
                    text: 'Yes',
                    btnClass: 'btn-red',
                    action: function() {
                        $scope.deleteNotification(key,notification);
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

    $scope.deleteNotification = function(key,notification){
        webServices.delete('notification/' + notification.id).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
               $scope.getNotification();
            } else {
                //authServices.logout();
            }
            $rootScope.loading = false;
        });
    }
    
    $scope.getNotification();

}]);