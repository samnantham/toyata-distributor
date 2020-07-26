'use strict';
angular.module('app')
  .run(
    [          '$rootScope', '$state', '$stateParams',
      function ($rootScope,   $state,   $stateParams) {
          $rootScope.$state = $state;
          $rootScope.$stateParams = $stateParams;        
      }
    ]
  )
  .config(
    [          '$stateProvider', '$urlRouterProvider', '$locationProvider', 'JQ_CONFIG', 'MODULE_CONFIG', 
      function ($stateProvider,   $urlRouterProvider, $locationProvider , JQ_CONFIG, MODULE_CONFIG) {
          
          var layout = "tpl/app.html";
          $urlRouterProvider.otherwise('/signin');
          if((window.location.href.substr(window.location.href.lastIndexOf('/') + 1)) == ''){
            window.location.href = 'signin';
          }
          
          $locationProvider.html5Mode(true);
          
          $stateProvider
              .state('app', {
                  abstract: true,
                  url: '/',
                  templateUrl: layout
              })

              //DASHBOARD

              .state('app.home', {
                  url: 'home',
                  templateUrl: 'tpl/home.html',
                  resolve: load(['moment','fullcalendar','ui.calendar','js/controllers/home.js'])
              })

              //MEBIT Events
              .state('app.events', {
                  url: 'events/list/:type?',
                  templateUrl: 'tpl/events/list.html',
                  resolve: load(['js/controllers/events/list.js'])
              })

              .state('app.viewevent', {
                  url: 'event/info/:id',
                  templateUrl: 'tpl/events/view.html',
                  resolve: load(['js/controllers/events/view.js'])
              })

              .state('app.editevent', {
                  url: 'event/edit/:id',
                  templateUrl: 'tpl/events/edit.html',
                  resolve: load(['js/controllers/events/edit.js'])
              })

              //TBP
              .state('app.tbps', {
                  url: 'tbps/list/:type?',
                  templateUrl: 'tpl/tbp/list.html',
                  resolve: load(['js/controllers/tbp/list.js'])
              })

              .state('app.viewtbp', {
                  url: 'tbp/info/:id',
                  templateUrl: 'tpl/tbp/view.html',
                  resolve: load(['js/controllers/tbp/view.js'])
              })

              .state('app.viewpdca', {
                  url: 'pdca/info/:id',
                  templateUrl: 'tpl/tbp/viewpdca.html',
                  resolve: load(['js/controllers/tbp/viewpdca.js'])
              })

              //Kaizen
              .state('app.kaizens', {
                  url: 'kaizen/list/:type?',
                  templateUrl: 'tpl/kaizen/list.html',
                  resolve: load(['js/controllers/kaizen/list.js'])
              })

              //Kaizen
              .state('app.viewkaizen', {
                  url: 'kaizen/view/:id',
                  templateUrl: 'tpl/kaizen/view.html',
                  resolve: load(['js/controllers/kaizen/view.js'])
              })

              //Profile Settings
              .state('app.profile', {
                  url: 'myprofile',
                  templateUrl: 'tpl/profile/myprofile.html',
                  resolve: load(['js/controllers/profile/myprofile.js'])
              })

              .state('app.changepassword', {
                  url: 'changepassword',
                  templateUrl: 'tpl/profile/changepassword.html',
                  resolve: load(['js/controllers/profile/changepassword.js'])
              })

              .state('app.notification', {
                  url: 'notifications',
                  templateUrl: 'tpl/profile/notification.html',
                  resolve: load(['js/controllers/profile/notification.js'])
              })

              .state('app.chats', {
                  url: 'chats',
                  templateUrl: 'tpl/profile/chats.html',
                  resolve: load(['js/controllers/profile/chats.js'])
              })

              .state('app.calendar', {
                  url: 'calendar',
                  templateUrl: 'tpl/calendar.html',
                  resolve: load(['moment','fullcalendar','ui.calendar','js/controllers/calendar.js'])
              })

              .state('app.404', {
                  url: '404',
                  templateUrl: 'tpl/page_404.html'
              })
              
              // others
              .state('access', {
                  url: '/',
                  template: '<div ui-view class="fade-in-right-big smooth"></div>'
              })
              .state('access.signin', {
                  url: 'signin',
                  templateUrl: 'tpl/auth/signin.html',
                  resolve: load( ['js/controllers/auth/signin.js'] )
              })
              
              .state('access.signup', {
                  url: 'signup',
                  templateUrl: 'tpl/auth/signup.html',
                  resolve: load( ['js/controllers/auth/signup.js'] )
              })

              .state('access.forgotpwd', {
                  url: 'forgotpwd',
                  templateUrl: 'tpl/auth/forgotpwd.html',
                  resolve: load( ['js/controllers/auth/forgotpwd.js'] )
              })

              .state('access.resetpwd', {
                  url: 'resetpwd/:token',
                  templateUrl: 'tpl/auth/resetpwd.html',
                  resolve: load( ['js/controllers/auth/resetpwd.js'] )
              });

              
          function load(srcs, callback) {
            return {
                deps: ['$ocLazyLoad', '$q',
                  function( $ocLazyLoad, $q ){
                    var deferred = $q.defer();
                    var promise  = false;
                    srcs = angular.isArray(srcs) ? srcs : srcs.split(/\s+/);
                    if(!promise){
                      promise = deferred.promise;
                    }
                    angular.forEach(srcs, function(src) {
                      promise = promise.then( function(){
                        if(JQ_CONFIG[src]){
                          return $ocLazyLoad.load(JQ_CONFIG[src]);
                        }
                        angular.forEach(MODULE_CONFIG, function(module) {
                          if( module.name == src){
                            name = module.name;
                          }else{
                            name = src;
                          }
                        });
                        return $ocLazyLoad.load(name);
                      } );
                    });
                    deferred.resolve();
                    return callback ? promise.then(function(){ return callback(); }) : promise;
                }]
            }
          }


      }
    ]
  );
