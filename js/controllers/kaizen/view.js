'use strict';

app.controller('KaizenInfoController', ['$scope', '$http', '$state', '$stateParams', 'webServices', 'utility', '$rootScope', '$timeout', '$filter', '$ngConfirm', '$sce', function($scope, $http, $state, $stateParams, webServices, utility, $rootScope, $timeout, $filter, $ngConfirm, $sce) {

    $scope.kaizen = {};
    $scope.module_id = 3;
    $scope.commentData = {};
    $scope.commentData.isfile = 0;
    
    $scope.getData = function() {
        webServices.get('kaizen/' + $stateParams.id).then(function(getData) {
            if (getData.status == 200) {
                $scope.kaizen = getData.data;
                $scope.mediafiles = $rootScope.splitFiles($scope.kaizen.kaizen_files); 
                $scope.kaizen.videocount = $rootScope.getfileCounts($scope.kaizen.kaizen_files,'video'); 
                $scope.kaizen.imagecount = $rootScope.getfileCounts($scope.kaizen.kaizen_files,'image'); 
                $scope.getComments();
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

    $scope.removeComment = function(id){
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
                        $scope.deleteComment(id);
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

    $scope.changeLike = function(){
        var obj = {};
        obj.module = $scope.module_id;
        obj.item = $stateParams.id;
        if(parseInt($scope.kaizen.isliked)){
            obj.status = 0;
        }else{
            obj.status = 1;
        }
        webServices.post('like',obj).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.kaizen.isliked = obj.status;
                if(obj.status){
                    $scope.kaizen.likes ++ ;
                }else{
                    $scope.kaizen.likes -- ;
                }
                 
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

    $scope.deleteComment = function(id){
        webServices.delete('comment/' + id).then(function(getData) {
            if (getData.status == 200) {
                $scope.getComments();
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

    $scope.getComments = function() {
        webServices.get('comments/3/' + $stateParams.id).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                $scope.comments = getData.data;
                $scope.viewKaizen();
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

    $scope.showHidecomment = function(key){
        if($scope.comments[key].showreply){
            $scope.commentData = {};
        }else{
            $scope.comments[key].replycomment = '';
        }
        $scope.comments[key].showreply = !$scope.comments[key].showreply;
        $scope.commentData.parent = $scope.comments[key].id;
        $scope.commentData.isfile = 0;
        $scope.commentData.item = $stateParams.id;
        $scope.commentData.module = $scope.module_id;
        $scope.commentData.is_admin = 0;
        $scope.commentData.is_reply = 1;
        $scope.commentData.reply_for = $scope.comments[key].id;
    }

    $scope.sendCommentReply = function(comment){
        if(comment){
            $scope.commentData.comment = comment;
            $scope.sendComment();
        }
    }

    $scope.sendsubCommentReply = function(comment){
        if(comment){
            $scope.commentData.comment = comment;
            $scope.sendComment();
        }
    }

    $scope.showHideSubCommentcomment = function(key,no){
        if($scope.comments[key].subcomments[no].showreply){
            $scope.commentData = {};
        }else{
            $scope.comments[key].subcomments[no].replycomment = '';
        }
        $scope.commentData.isfile = 0;
        $scope.commentData.item = $stateParams.id;
        $scope.commentData.module = $scope.module_id;
        $scope.comments[key].subcomments[no].showreply = !$scope.comments[key].subcomments[no].showreply;
        $scope.commentData.parent = $scope.comments[key].id;
        $scope.commentData.is_admin = 0
        $scope.commentData.is_reply = 1
        $scope.commentData.reply_for = $scope.comments[key].subcomments[no].id;
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

    $scope.removeFile = function(key,data){
        if(!data.isfile){
            $scope.formData.deleted_kaizen_files.push(data);
        }
        $scope.formData.kaizen_files.splice(key,1);
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

    $scope.openaddModal = function() {
        $scope.inputchange();
        $scope.formData = {};
        $scope.formData = angular.copy($scope.kaizen);
        $scope.formData.type = $scope.formData.type.toString();
        $scope.formData.deleted_kaizen_files = [];
        $scope.formData.deleted_kaizen_documents = [];
        $('#PopupModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }

    $scope.inputchange = function() {
        $scope.errorData = {};
        $scope.seterrorMsg();
    }

    $scope.closeModal = function() {
        $scope.formData = {};
        $scope.isedit = false;
        $('#PopupModal').modal('hide');
        $rootScope.modalerrors = [];
    }
    
    $scope.seterrorMsg = function(){
        $scope.errorData.title_errorMsg = 'Enter Title';
        $scope.errorData.description_errorMsg = 'Please add kaizen Study';
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

     $scope.uploadFile = function(files) {
        $scope.errors = [];
        if (files && files.length) {
            var extn = files[0].name.split(".").pop();
            if ($rootScope.imgextensions.includes(extn.toLowerCase())) {
                if (files[0].size <= $rootScope.maxUploadsize) {
                    $scope.commentData.commentfile = files[0];
                    $scope.commentData.isfile = 1;
                    $scope.commentData.item = $stateParams.id;
                    $scope.commentData.module = $scope.module_id;
                    $scope.sendComment();
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

    $scope.addComment = function(){
        if($scope.commentData.comment){
            $scope.commentData.commentfile = '';
            $scope.commentData.isfile = 0;
            $scope.commentData.item = $stateParams.id;
            $scope.commentData.module = $scope.module_id;
            $scope.sendComment();
        }
    }

    $scope.sendComment = function(){
         webServices.upload('comment',$scope.commentData).then(function(getData) {
            $rootScope.loading = false;
            if (getData.status == 200) {
                 $scope.commentData = {};
                 $scope.getComments();
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
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

    $scope.removeDocuments = function(key,data){
        if(!data.isfile){
            $scope.formData.deleted_kaizen_documents.push(data);
        }
        $scope.formData.kaizen_documents.splice(key,1);
    }

    $scope.addData = function(form) {
        $scope.seterrorMsg();
        if (form.$valid) {
            $rootScope.loading = true;
                webServices.putupload('kaizen/'+$stateParams.id, $scope.formData).then(function(getData) {
                    $rootScope.loading = false;
                    if (getData.status == 200) {
                        $scope.closeModal();
                        $rootScope.$emit("showSuccessMsg", getData.data.message);
                        $state.reload();
                    } else if (getData.status == 401) {
                        $scope.setservererrorMsg(getData.data.message);
                        $rootScope.loading = false;
                    }/* else {
                        $rootScope.$emit("showISError", getData);
                    }*/
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

    $scope.removeKaizen = function() {
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
                        $scope.deleteKaizen();
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

    $scope.deleteKaizen = function(id){
        webServices.delete('kaizen/' + $stateParams.id).then(function(getData) {
            if (getData.status == 200) {
                $rootScope.$emit("showSuccessMsg", getData.data.message);
                $state.go('app.kaizens',{type:1});
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

    $scope.viewKaizen = function(){
        var obj = {};
        obj.module = $scope.module_id;
        obj.item = $stateParams.id;
        webServices.post('view',obj).then(function(getData) {
            console.log(getData)
            if (getData.status == 200) {
            } else {
                $rootScope.$emit("showISError",getData);
            }
        });
    }

   $scope.getData();

}]);