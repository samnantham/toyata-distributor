(function() {
    'use strict';

    angular.module('ui.load')
        .service('webServices', webServices);

    function webServices($q, $http, $sessionStorage, $rootScope, authServices, Upload) {

        var URL = app.apiurl;
        var obj = {};

        return {
            get: function(q) {
                var deferred = $q.defer();
                
                $http({
                    method: 'GET',
                    url: URL + q,
                    cache: false,
                    headers: {
                        'Authorization': "Bearer " + authServices.getToken(),
                        'Content-Type': 'application/json'
                    }
                }).then(function(response) {
                    deferred.resolve(response);
                }, function(response) {
                    //authServices.logout();
                    deferred.resolve(response);
                });
                return deferred.promise;
            },
            
            post: function(q, object) {
                var deferred = $q.defer();
                
                $http({
                    method: 'POST',
                    url: URL + q,
                    data: object,
                    headers: {
                        'Authorization': "Bearer " + authServices.getToken(),
                        'Content-Type': 'application/json'
                    }
                }).then(function(response) {
                    deferred.resolve(response);
                }, function(err) {
                    deferred.resolve(err);
                });
                return deferred.promise;
            },

            download: function(q) {
                var deferred = $q.defer();
                
                $http({
                    method: 'GET',
                    url: URL + q,
                    cache: false,
                    headers: {
                        'Authorization': "Bearer " + authServices.getToken(),
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer'
                }).then(function(response) {
                    deferred.resolve(response);
                }, function(response) {
                    deferred.resolve(response);
                });
                return deferred.promise;
            },


            put: function(q, object) {
                var deferred = $q.defer();
                
                $http({
                    method: 'PUT',
                    url: URL + q,
                    data: object,
                    headers: {
                        'Authorization': "Bearer " + authServices.getToken(),
                        'Content-Type': 'application/json'
                    }
                }).then(function(response) {
                    deferred.resolve(response);
                }, function(err) {
                    deferred.resolve(err);
                });
                return deferred.promise;
            },
            
            normalpost: function(q, object) {
                var deferred = $q.defer();
                
                $http({
                    method: 'POST',
                    url: URL + q,
                    data: object,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function(response) {
                    deferred.resolve(response);
                }, function(err) {
                    deferred.resolve(err);
                });
                return deferred.promise;
            },

            delete: function(q, object) {
                var deferred = $q.defer();
                                $http({
                    method: 'delete',
                    url: URL + q,
                    data: object,
                    headers: {
                        'Authorization': "Bearer " + authServices.getToken(),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).then(function(response) {
                    deferred.resolve(response);
                }, function(response) {
                    deferred.resolve(response);
                });
                return deferred.promise;
            },

            upload: function(q, data) {

                var deferred = $q.defer();
                
                Upload.upload({
                    url: URL + q,
                    headers: {
                        'Authorization': "Bearer " + authServices.getToken(),
                        'Content-Type': 'application/json'
                    },
                    data: data
                }).then(function(response) {
                    deferred.resolve(response);
                }, function(response) {
                    deferred.resolve(response);
                }, function(evt) {
                    console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '% ');
                });

                return deferred.promise;

            },

            putupload: function(q, data) {

                var deferred = $q.defer();
                                data._method = 'PUT';
                Upload.upload({
                    url: URL + q,
                    headers: {
                        'Authorization': "Bearer " + authServices.getToken(),
                        'Content-Type': 'application/json'
                    },
                    data: data
                }).then(function(response) {
                    deferred.resolve(response);
                }, function(response) {
                    deferred.resolve(response);
                }, function(evt) {
                    console.log('progress: ' + parseInt(100.0 * evt.loaded / evt.total) + '% ');
                });

                return deferred.promise;

            },
        }
    }

})();