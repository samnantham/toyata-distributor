'use strict';
app.controller('ChatController', ['$scope', '$http', '$state', 'authServices', '$sessionStorage', 'webServices', 'utility', '$rootScope', '$stateParams', '$timeout', 'toaster', '$firebaseArray', function($scope, $http, $state, authServices, $sessionStorage, webServices, utility, $rootScope, $stateParams, $timeout, toaster, $firebaseArray) {

    $scope.chatid = $stateParams.chatid;
    $scope.filterData = {};
    $scope.filterData.active = 0;
    $scope.chatMessage = {};
    $scope.chatMessage.isfile = 0;
    $scope.chatMessage.fileurl = '-';
    $scope.pageno = 1;
    $scope.totalData = 0;
    $scope.totalPerPage = $rootScope.pagelimits[0];

    $scope.createFirebaseauth = function() {
        firebase.auth().createUserWithEmailAndPassword($rootScope.user.email, $rootScope.user.firebasepassword).then(function() {
            $scope.loginFirebaseauth();
        }).catch(function(error) {
            console.log(error);
        });
    }

    $scope.loginFirebaseauth = function() {
        firebase.auth().signInWithEmailAndPassword($rootScope.user.email, $rootScope.user.firebasepassword).then(function() {
            $scope.getFirebaseUser();
        }).catch(function(error) {
            console.log(error);
        });
    }

    $scope.changeActive = function(key, user) {
        if (key != $scope.filterData.active) {
            $scope.filterData.active = key;
            $rootScope.loading = true;
            $rootScope.chatData = [];
            $scope.checkroom();
        }
    }

    $scope.getFirebaseUser = function() {
        firebase.auth().onAuthStateChanged(function(user) {
            if (!$rootScope.user.firebaseid) {
                $rootScope.loading = false;
                $scope.updatefirebaseid(user.uid)
            } else {
                $scope.checkroom();
            }
        });
    }

    $scope.updatefirebaseid = function(firebaseid) {
        var obj = {
            firebaseid: firebaseid
        };
        webServices.put('profile/update/firebaseid', obj).then(function(getData) {
            if (getData.status == 200) {
                $scope.checkroom();
            } else {

            }
        });
    }

    $scope.checkroom = function() {
        webServices.post('chat/room/'+ $scope.users[$scope.filterData.active].id).then(function(getData) {
            if (getData.status == 200) {
                $scope.RoomData = getData.data;
                $scope.chattype = 'privatechat';
                $scope.firebaseurl = '/'+ $scope.RoomData.id +'/';
                $scope.getChatContent();
            } else {

            }
        });
    }


    $scope.getChatContent = function() {
        firebase.auth().onAuthStateChanged(function(user) {
            $rootScope.loading = false;
            if (user.uid == $rootScope.user.firebaseid) {
                $rootScope.ref = firebase.database().ref().child($scope.chattype).child($scope.firebaseurl);
                $rootScope.chatData = $firebaseArray($rootScope.ref);
            }
        });
    }

    $scope.sendReplymessage = function() {
        if ($scope.chatMessage.message) {
            firebase.auth().onAuthStateChanged(function(user) {
                $rootScope.ref.push({
                    user_id: $rootScope.user.id,
                    username: $rootScope.user.first_name,
                    message: $scope.chatMessage.message,
                    avatar: $rootScope.user.avatar,
                    isfile: $scope.chatMessage.isfile,
                    fileurl: $scope.chatMessage.fileurl,
                    created_at: firebase.database.ServerValue.TIMESTAMP,
                });
                $timeout(function() {
                    $scope.chatMessage.message = '';
                    $scope.chatMessage.isfile = 0;
                    $scope.chatMessage.fileurl = '-';
                    $scope.getusers();
                    $scope.filterData.active = 0;
                }, 200);
            });
        }
    }

    $scope.sendchatattachment = function(files) {
        if (files && files.length) {
            var extn = files[0].name.split(".").pop();
            if ($rootScope.imgextensions.includes(extn.toLowerCase())) {
                if (files[0].size <= $rootScope.maxUploadsize) {
                    var obj = {};
                    obj.file = files[0];
                    $scope.uploadchatattachment(obj);
                } else {
                    $rootScope.$emit("showerrormsg", files[0].name + ' size exceeds 2MB.');
                }
            } else {
                $rootScope.$emit("showerrormsg", files[0].name + ' format unsupported.');
            }
        }
    }

    $scope.uploadchatattachment = function(obj) {
        webServices.upload('chat/upload/attachment', obj).then(function(getData) {
            if (getData.status == 200) {
                $scope.chatMessage.fileurl = getData.data;
                $scope.chatMessage.message = 'Uploaded a File';
                $scope.chatMessage.isfile = 1;
                $scope.sendReplymessage();
            }
        });
    }

    $scope.getusers = function() {
        webServices.post('users/' + $scope.totalPerPage + '?page=' + $scope.pageno, $scope.filterData).then(function(getData) {
            if (getData.status == 200) {
                $scope.users = getData.data;
            } else {
                //$rootScope.logout();
            }
        });
    }

    if (!$rootScope.user.firebaseid) {
        $scope.createFirebaseauth();
    } else {
        $scope.loginFirebaseauth();
    }

    $scope.getusers();

}]);