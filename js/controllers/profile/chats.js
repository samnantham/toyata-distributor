'use strict';
app.controller('ChatController', ['$scope', '$http', '$state', 'authServices', '$ngConfirm', 'webServices', 'utility', '$rootScope', '$stateParams', '$timeout', 'toaster', '$firebaseArray', function($scope, $http, $state, authServices, $ngConfirm, webServices, utility, $rootScope, $stateParams, $timeout, toaster, $firebaseArray) {

    $scope.chatid = $stateParams.chatid;
    $scope.filterData = {};
    $scope.filterData.active = 0;
    $scope.chatMessage = {};
    $scope.chatMessage.isfile = 0;
    $scope.chatMessage.fileurl = '-';
    $scope.pageno = 1;
    $scope.totalData = 0;
    $scope.totalPerPage = $rootScope.pagelimits[0];
    $scope.userslist = {};
    $scope.RoomData = {};
    $scope.RoomData.show_tooltip = true;

    $scope.createFirebaseauth = function() {
        firebase.auth().createUserWithEmailAndPassword($rootScope.user.email, $rootScope.user.firebasepassword).then(function() {
            $scope.getFirebaseUser();
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

    $scope.deletechat = function(chat){
        webServices.delete('chat/clear/'+ chat.id + '/1').then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $scope.RoomData = getData.data.data;
                $scope.getusers(); 
            }else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.convertTime = function(time){
      return Math.floor((Date.now() - (time * 1000) )/1000/60);
    }

    $scope.clearchat = function(chat){
        webServices.delete('chat/clear/'+ chat.id + '/0').then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $scope.RoomData = getData.data.data;
                $scope.getusers(); 
            }else {
                $rootScope.$emit("showISError", getData);
            }
        });
    }

    $scope.getFirebaseUser = function() {
        firebase.auth().onAuthStateChanged(function(user) {
            if (!$rootScope.user.firebaseid) {
                $rootScope.loading = false;
                $scope.updatefirebaseid(user.uid)
            } else {
                if(Object.keys($scope.RoomData).length > 1){
                    $scope.gotoRoom($scope.RoomData);
                }
            }
        });
    }

    $scope.updatefirebaseid = function(firebaseid) {
        var obj = {
            firebaseid: firebaseid
        };
        webServices.put('profile/update/firebaseid', obj).then(function(getData) {
            if (getData.status == 200) {
                $rootScope.getUserInfo();
                if(Object.keys($scope.RoomData).length > 1){
                    $scope.gotoRoom($scope.RoomData);
                }
            }
        });
    }

    $scope.removechatItem = function(message){
        $rootScope.ref.child(message.$id).remove();
        if(message.isfile){
            $scope.deleteFile(message.fileurl);
        }
    }

    $scope.deleteFile = function(file){
        var obj = {};
        obj.file = file
        webServices.post('chat/delete/attachment', obj).then(function(getData) {
            if (getData.status == 200) {
            }
        });
    }

    $scope.createRoom = function(key,data){
        var obj = {};
        obj.is_admin_chat = data.is_admin;
        obj.chatuser = data.id;
        webServices.post('chat/room',obj).then(function(getData) {
            if (getData.status == 200) {
                $scope.RoomData = getData.data;
                $scope.gotoRoom(getData.data);
            }
        });
    }

    $scope.getChatContent = function() {
        firebase.auth().onAuthStateChanged(function(user) {
            $rootScope.loading = false;
            if (user) {
                if(user.uid == $rootScope.user.firebaseid){
                    $rootScope.ref = firebase.database().ref().child($scope.chattype).child($scope.firebaseurl);
                    $rootScope.chatData = $firebaseArray($rootScope.ref);
                }
            }else{
                if (!$rootScope.user.firebaseid) {
                    $scope.createFirebaseauth();
                } else {
                    $scope.loginFirebaseauth();
                }
            }
        });
    }

    $scope.gotoRoom = function(data){
        $rootScope.loading = true;
        $scope.RoomData = data;
        $scope.RoomData.show_tooltip = false;
        if($scope.RoomData.chat_type == 1){
            if($scope.RoomData.is_admin_chat){
                $scope.chattype = 'admin-user';
            }else{
                $scope.chattype = 'user-user';
            }
        }else if($scope.RoomData.chat_type == 2){
            $scope.chattype = 'groupchat';
        }
        $scope.firebaseurl = '/'+ $scope.RoomData.chatroom_id +'/';
        $scope.getChatContent();
    }

    $scope.openModal = function() {
        $scope.isedit = false;
        $scope.searchData = {};
        $scope.groupData = {};
        $scope.groupData.group_members = [];
        $scope.getgroupusers();
        $('#PopupModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.editgroup = function(data) {
        $rootScope.loading = true;
        $scope.isedit = true;
        $scope.searchData = {};
        $scope.groupData = data.groupinfo;
        $scope.groupData.group_members = [];
        $scope.getgroupusers();

        $timeout(function() {
            $scope.assignmembersChecked();
            $('#PopupModal').modal({
                backdrop: 'static',
                keyboard: false
            });
        }, 1000);    
    }

    $scope.deletegroupData = function(id) {
        var url = '/'+ id +'/';
        $scope.ref = firebase.database().ref().child('groupchat').child(url);
        $scope.ref.remove();
        webServices.delete('group/' + id).then(function(getData) {
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $scope.getusers();
            } else {
                $rootScope.$emit("showISError", getData);
            }
        });
        
    }

    $scope.deletegroup = function(data) {
        $ngConfirm({
            title: 'Are you sure want to delete this group?',
            content: '',
            type: 'red',
            typeAnimated: true,
            buttons: {
                tryAgain: {
                    text: 'Yes',
                    btnClass: 'btn-red',
                    action: function() {
                        $scope.deletegroupData(data.chatroom_id);
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


    $scope.assignmembersChecked = function(){
        angular.forEach($scope.groupData.members, function(member, no) {
            member.memberprofile.is_admin = member.is_admin;
            $scope.groupData.group_members.push(member.memberprofile);
            angular.forEach($scope.groupuserslist.adminusers, function(admin, num) {
                if(member.is_admin && member.member_id == admin.id){
                    admin.ischecked = 1;
                }
            });

            angular.forEach($scope.groupuserslist.users, function(user, num) {
                if(!member.is_admin && member.member_id == user.id){
                    user.ischecked = 1;
                }
            });
        });
        $rootScope.loading = false;
    }

    $scope.setservererrorMsg = function(errors){
        $scope.errorData = {};
        angular.forEach(errors, function(error, no) {
            $scope.errorData[no.replace('new','')+'_errorMsg'] = error[0];
            $scope.errorData[no.replace('new','')+'_error'] = true;
        });
    }

     $scope.createGroup = function(form) {
        $scope.errorData = {};
        $scope.errors = [];
        if (form.$valid) {
            $rootScope.loading = true;
            if (!$scope.isedit) {
                webServices.upload('group/chat', $scope.groupData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.closeModal();
                        $scope.getusers();
                    } else if (getData.status == 401) {
                        $scope.setservererrorMsg(getData.data.message);
                        $rootScope.loading = false;
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            }else{
                webServices.putupload('group/chat/'+$scope.groupData.id, $scope.groupData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $scope.closeModal();
                        $scope.getusers();
                    } else if (getData.status == 401) {
                        $scope.setservererrorMsg(getData.data.message);
                        $rootScope.loading = false;
                    } else {
                        $rootScope.$emit("showISError", getData);
                    }
                });
            }
        } else {
            if (!form.icon.$valid) {
                $scope.errorData.icon_error = true;
            }if (!form.members.$valid) {
                $scope.errorData.members_error = true;
            }if (!form.group_name.$valid) {
                $scope.errorData.group_name_error = true;
            }
        }
    }

    $scope.addgroupadminMember = function(status,user){
        if(status){
            $scope.groupData.group_members.push(user);
        }else{
            $scope.removeMember(user);
        }
    }
    $scope.addgroupMember = function(status,user){
        if(status){
            $scope.groupData.group_members.push(user);
        }else{
            $scope.removeMember(user);
        }
    }

    $scope.removeMember = function(member){
        angular.forEach($scope.groupData.group_members, function(groupmember, no) {
            if((member.id == groupmember.id) && (member.is_admin == groupmember.is_admin)){
                $scope.groupData.group_members.splice(no,1);
            }
        });
    }

    $scope.uploadIcon =  function(files) {
    $scope.errors = [];
        if (files && files.length) {
            var extn = files[0].name.split(".").pop();
            if ($rootScope.imgextensions.includes(extn.toLowerCase())) {
                if (files[0].size <= $rootScope.maxUploadsize) {
                    $scope.groupData.newicon = files[0];
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

    $scope.getgroupusers = function() {
        webServices.post('group/users', $scope.searchData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.groupuserslist = getData.data;
            } else {
                //$rootScope.logout();
            }
        });
    }

    $scope.closeModal = function() {
        $('#PopupModal').modal('hide');
        $scope.groupData = {};
        $scope.isedit = false;
    }

    $scope.changeActive = function(key, user) {
        if (key != $scope.filterData.active) {
            $scope.filterData.active = key;
            $rootScope.loading = true;
            $rootScope.chatData = [];
            $scope.checkroom();
        }
    }
    
    $scope.updateroom = function() {
        webServices.put('chat/room/'+ $scope.RoomData.chatroom_id + '/' + $scope.RoomData.chat_type).then(function(getData) {
            if (getData.status == 200) {
            } else {

            }
        });
    }

     $rootScope.$watch('chatData', function (newVal, oldVal) {  
        $timeout(function() {
            var height = (document.querySelector(".messenger .mCustomScrollBox")).scrollHeight;
            $scope.updateScrollbar('scrollTo', height);
        },200);
        $timeout(function() {
            $scope.getusers(); 
        },5000);
    }, true);

    $scope.sendReplymessage = function() {
        if ($scope.chatMessage.message) {
            firebase.auth().onAuthStateChanged(function(user) {
                $rootScope.ref.push({
                    user_id: $rootScope.user.id,
                    username: $rootScope.user.first_name,
                    isadmin: 0,
                    message: $scope.chatMessage.message,
                    avatar: $rootScope.user.avatar,
                    isfile: $scope.chatMessage.isfile,
                    fileurl: $scope.chatMessage.fileurl,
                    created_at: firebase.database.ServerValue.TIMESTAMP,
                });
                $scope.updateroom();
                $timeout(function() {
                    $scope.chatMessage.message = '';
                    $scope.chatMessage.isfile = 0;
                    $scope.chatMessage.fileurl = '-';
                    $scope.filterData.active = 0;
                    $(".in").removeClass("in");
                    document.getElementById("chatText").focus();
                }, 200);
            });
        }
    }

    $scope.messageUpdated = function(){
        //$(".in").removeClass("in");
        document.getElementById("chatText").focus();
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
        $scope.userslist = {};
        webServices.post('users/' + $scope.totalPerPage + '?page=' + $scope.pageno, $scope.filterData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.userslist = getData.data;
            } else {
                //$rootScope.logout();
            }
        });
    }

    if ($rootScope.user.firebaseid == '') {
        $timeout(function() {
            $scope.createFirebaseauth();
        }, 2000);
    }else{
        $timeout(function() {
            $scope.loginFirebaseauth();
        }, 2000);
    }

    $scope.getusers();

}]);