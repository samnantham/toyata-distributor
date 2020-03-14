
(function () {
  'use strict';

  angular.module('ui.load')
    .service('utility', utility);

  /** @ngInject */
  function utility($q,$sessionStorage) {
    return {
      getParam: function (data) {
                var returnString = '';
                var d ='';
                for (d in data) 
                {
                  if (data.hasOwnProperty(d))
                  returnString += d + '=' + data[d] + '&';
                }
                return returnString.slice(0, returnString.length - 1);
      },
      getId : function(data,field,param){

          var id;
          angular.forEach(data, function(value, key) {
              if(value[field]==param){

                id = value.id;
              }
          });
          return id;
      },
      convertTimeObject : function(data){

          var split_date = data.split('-');
          var month = split_date[1];
          var year = split_date[0];
          var date = split_date[2].split(' ')[0];
                      
           return new Date(month+'/'+date+'/'+year);
      },
      assignField : function(data,field,param){
        
          angular.forEach(data, function(value, key) {

              value[field]=param
          });

          return data;
      },
      autoFocus : function(data,field,param){
        
          angular.forEach(data, function(value, key) {

              value[field]=param;

              // if(param==key){

              //     value[field]=true;
              // }
          });

          return data;
      },
      getKey : function(data,field,param){

          var getkey;
          
          angular.forEach(data, function(value, key) {

              if(value[field]==param){

                getkey = key;
              }
          });
          return getkey;
      },
      getItemByKey : function(data,item){

          var getkey;
          
          angular.forEach(data, function(value, key) {

              if(value==item){

                getkey = key;
              }
          });
          return getkey;
      },
      validateEmail :function(data){

          var valid = true;
          var emails = data.split(";");
          var regex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;

          emails.forEach(function (email) {
             
              if(!regex.test(email)) {
                  
                 valid = false;
              }

          });

          return valid;
      },
      
      getError : function(data){

          var error_msg =[];
          angular.forEach(data, function(value, key) {
              error_msg.push(value[0]);
          });
          return error_msg;
      },
      setSession : function(data,type){

        $sessionStorage[type] = data;
      },
      getSession : function(type){

        return $sessionStorage[type];
      }
    }
  }

})();