'use strict';
app.controller('ChatController', ['$scope', '$http', '$state', 'authServices', '$sessionStorage', 'webServices', 'utility', '$rootScope', '$stateParams', '$timeout', 'toaster',  '$firebaseArray', function($scope, $http, $state, authServices, $sessionStorage, webServices, utility, $rootScope, $stateParams, $timeout, toaster, $firebaseArray) {

    $scope.formData = {};

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


            $scope.getFirebaseUser = function() {
                firebase.auth().onAuthStateChanged(function(user) {
                    console.log(user)
                    if (!$rootScope.user.firebaseid) {
                        $scope.updatefirebaseid(user.uid)
                    } else {
                        $scope.createRoom();
                        /*$scope.goafterLogin();*/
                    }
                });
            }

            $scope.createRoom = function(){
                $scope.chattype = 'privatechat';
                $scope.firebaseurl = '/private-1/';
                $rootScope.ref = firebase.database().ref().child($scope.chattype).child($scope.firebaseurl);
                $rootScope.chatData = $firebaseArray($rootScope.ref);
                console.log($rootScope.chatData)
                $timeout(function() {
                    //$scope.sendMessage();
                }, 500);
            }

            $scope.updatefirebaseid = function(firebaseid) {
                var obj = {
                    firebaseid: firebaseid
                };
                webServices.put('profile/update/firebaseid', obj).then(function(getData) {
                    if (getData.status == 200) {
                        console.log(getData)
                        //$rootScope.goafterLogin();
                    } else {
                        
                    }
                });
            }

            $scope.sendMessage = function(){
                 firebase.auth().onAuthStateChanged(function(user) {
                    $rootScope.ref.push({
                        user_id: $rootScope.user.id,
                        username: $rootScope.user.username,
                        message: 'Test chat',
                        avatar: $rootScope.user.avatar,
                        isfile: 0,
                        fileurl: '',
                        created_at: firebase.database.ServerValue.TIMESTAMP,
                    });
                });
            }

    /*if (!$rootScope.user.firebaseid) {
        console.log($rootScope.user)
        $scope.createFirebaseauth();
    } else {
        $scope.loginFirebaseauth();
    }
*/

}]);