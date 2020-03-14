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
                app.apiurl = "http://67.205.159.216/API/user/";
                app.imageurl = "http://67.205.159.216/API/";
                app.noauthroutes = ['access.signin','access.signup','access.forgotpwd','access.resetpwd'];
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
                },{
                    id: 4,
                    type: 'Others'
                }];

                app.kaizen_upload_types = [{
                    id: 1,
                    type: 'Step 1filter'
                }, {
                    id: 2,
                    type: 'Step 1 Revised'
                }, {
                    id: 3,
                    type: 'Step 1-3'
                },{
                    id: 4,
                    type: 'Step 1-3 Revised'
                },{
                    id: 5,
                    type: 'Step 1-5'
                }, {
                    id: 6,
                    type: 'Step 1-5 Revised'
                }, {
                    id: 7,
                    type: 'Step 1-8'
                },{
                    id: 8,
                    type: 'Step 1-8 Revised'
                }];
            }

        ]).config(function (ScrollBarsProvider) {
            ScrollBarsProvider.defaults = {
                scrollButtons: {
                    scrollAmount: 'auto', // scroll amount when button pressed
                    enable: true // enable scrolling buttons by default
                },
                axis: 'y',
                scrollInertia: 800, // enable 2 axis scrollbars by default
            };
        });