// config
var app =
    angular.module('app')
    .config(
        ['$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
            function($controllerProvider, $compileProvider, $filterProvider, $provide) {

                app.controller = $controllerProvider.register;
                app.directive = $compileProvider.directive;
                app.filter = $filterProvider.register;
                app.factory = $provide.factory;
                app.service = $provide.service;
                app.constant = $provide.constant;
                app.value = $provide.value;
                app.apiurl = "http://localhost/project/Rilwan/API/user/";
                app.imageurl = "http://localhost/project/Rilwan/API/";
                app.noauthroutes = ['access.signin','access.signup','access.forgotpwd','access.distributor_signin','access.resetpwd'];
                app.pagelimits = [10, 25, 50, 100];
                app.constantlatlong = {lat:'25.0688266',long:'55.1394262',location:'1 Sheikh Mohammed bin Rashid Blvd - Dubai - United Arab Emirates'};
                app.imgextensions = ['jpeg', 'png', 'jpg', 'gif'];
                app.maxUploadsize = 2000000;
                app.maxUploadFiles = 6;
                app.validextensions = ['jpeg', 'png', 'jpg', 'gif', '3gp', 'mp4'];
                app.validfileextensions = ['pdf', 'xls', 'xlsx', 'csv', 'doc', 'docx'];
                app.tbptypes = [{
                    id: 1,
                    type: 'DMDP'
                }, {
                    id: 2,
                    type: 'Mentor'
                }, {
                    id: 3,
                    type: 'Crash'
                }];
                app.kaizentypes = [{
                    id: 1,
                    type: 'Kaizen Report'
                }, {
                    id: 2,
                    type: 'Branch SGA'
                }, {
                    id: 3,
                    type: 'Practices'
                }];
            }

        ]);