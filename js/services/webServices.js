(function() {
    'use strict';

    angular.module('ui.load')
        .service('webServices', webServices);

    function webServices($q, $http, $sessionStorage, $rootScope, authServices, Upload) {

        var API_URL = app.apiurl;
        var obj = {};

        console.log(authServices.getToken())

        return {
            get: function(q) {
                var deferred = $q.defer();
                var splitUrl = API_URL + q;
                if (splitUrl.indexOf('?page') > 0) {
                    var URL = API_URL + q;
                } else {
                    var URL = API_URL + q;
                }

                var start = new Date().getTime();
                $http({
                    method: 'GET',
                    url: URL,
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
                var splitUrl = API_URL + q;
                var check = splitUrl.indexOf('login');

                if (check > 0) {
                    URL = splitUrl;
                } else {
                    URL = splitUrl;
                }

                $http({
                    method: 'POST',
                    url: URL,
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
                var URL = API_URL + q;

                $http({
                    method: 'GET',
                    url: URL,
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
                var splitUrl = API_URL + q;
                URL = splitUrl;

                $http({
                    method: 'PUT',
                    url: URL,
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
                var URL = API_URL + q;

                $http({
                    method: 'POST',
                    url: URL,
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
                    url: API_URL + q,
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
                var URL = API_URL + q;
                var start = new Date().getTime();

                Upload.upload({
                    url: URL,
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
                var URL = API_URL + q;
                var start = new Date().getTime();
                data._method = 'PUT';
                Upload.upload({
                    url: URL,
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