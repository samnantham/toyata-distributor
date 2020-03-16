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
                app.apiurl = "http://localhost/project/Rilwan/Toyota/API/user/";
                app.imageurl = "http://localhost/project/Rilwan/Toyota/API/";
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

                app.tbp_upload_types = [{
                    id: 1,
                    type: 'Step 1filter',
                    typename:'type1'
                }, {
                    id: 2,
                    type: 'Step 1 Revised',
                    typename:'type2'
                }, {
                    id: 3,
                    type: 'Step 1-3',
                    typename:'type3'
                },{
                    id: 4,
                    type: 'Step 1-3 Revised',
                    typename:'type4'
                },{
                    id: 5,
                    type: 'Step 1-5',
                    typename:'type5'
                }, {
                    id: 6,
                    type: 'Step 1-5 Revised',
                    typename:'type6'
                }, {
                    id: 7,
                    type: 'Step 1-8',
                    typename:'type7'
                },{
                    id: 8,
                    type: 'Step 1-8 Revised',
                    typename:'type8'
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