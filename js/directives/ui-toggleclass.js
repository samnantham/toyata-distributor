angular.module('app')
.directive('uiToggleClass', ['$timeout', '$document', function($timeout, $document) {
    return {
        restrict: 'AC',
        link: function(scope, el, attr) {
            el.on('click', function(e) {
                e.preventDefault();
                var classes = attr.uiToggleClass.split(','),
                targets = (attr.target && attr.target.split(',')) || Array(el),
                key = 0;
                angular.forEach(classes, function(_class) {
                    var target = targets[(targets.length && key)];
                    (_class.indexOf('*') !== -1) && magic(_class, target);
                    $(target).toggleClass(_class);
                    key++;
                });
                $(el).toggleClass('active');

                function magic(_class, target) {
                    var patt = new RegExp('\\s' +
                        _class.replace(/\*/g, '[A-Za-z0-9-_]+').split(' ').join('\\s|\\s') +
                        '\\s', 'g');
                    var cn = ' ' + $(target)[0].className + ' ';
                    while (patt.test(cn)) {
                        cn = cn.replace(patt, ' ');
                    }
                    $(target)[0].className = $.trim(cn);
                }
            });
        }
    };
}])

.filter("trustUrl", ['$sce', function ($sce) {
    return function (recordingUrl) {
        return $sce.trustAsResourceUrl(recordingUrl);
    };
}])

.filter('ageFilter', function() {
    function calculateAge(birthday) {
     newdate =  new Date(birthday); // birthday is a date
     var ageDifMs = Date.now() - newdate.getTime();
         var ageDate = new Date(ageDifMs); // miliseconds from epoch
         return Math.abs(ageDate.getUTCFullYear() - 1970) +' Years';
     }

     return function(birthdate) { 
         return calculateAge(birthdate);
     }; 
 })

.directive('someVideo', function ($window, $timeout) {
    return {
        scope: {
            videoCurrentTime: "=videoCurrentTime"
        },
        controller: function ($scope, $element) {

            $scope.onTimeUpdate = function () {
                var currTime = $element[0].currentTime;
                if (currTime - $scope.videoCurrentTime > 0.5 || $scope.videoCurrentTime - currTime > 0.5) {
                    $element[0].currentTime = $scope.videoCurrentTime;
                }
                $scope.$apply(function () {
                    $scope.videoCurrentTime = $element[0].currentTime;
                });
            }
        },
        link: function (scope, elm) {
            // Use this $watch to restart the video if it has ended
            scope.$watch('videoCurrentTime', function (newVal) {

                if (elm[0].ended) {
                    // Do a second check because the last 'timeupdate'
                    // after the video stops causes a hiccup.
                    if (elm[0].currentTime !== newVal) {
                        elm[0].currentTime = newVal;
                        elm[0].play();
                    }
                }
            });
            // Otherwise keep any model syncing here.
            elm.bind('timeupdate', scope.onTimeUpdate);
        }
    }
})


.directive('scrollToBottom', function($timeout, $window) {
    return {
        scope: {
            scrollToBottom: "="
        },
        restrict: 'A',
        link: function(scope, element, attr) {
            scope.$watchCollection('scrollToBottom', function(newVal) {
                if (newVal) {
                    $timeout(function() {
                        element[0].scrollTop = element[0].scrollHeight;
                    }, 0);
                }

            });
        }
    };
})

.directive('errSrc', function() {
    return {
        link: function(scope, element, attrs) {
            var defaultSrc = attrs.src;
            element.bind('error', function() {
                if(attrs.errSrc) {
                    element.attr('src', attrs.errSrc);
                }
                else if(attrs.src) {
                    element.attr('src', defaultSrc);
                }
            });
        }
    }
})

.directive('backgroundImage', function(){
    return function(scope, element, attrs){
        restrict: 'A',
        attrs.$observe('backgroundImage', function(value) {
            element.css({
                'background-image': 'url(' + value +')'
            });
        });
    };
})

.directive('focusMe', function($timeout) {
    return {
        scope: {
            focusMeIf: "="
        },
        link: function(scope, element, attrs) {
            if (scope.focusMeIf === undefined || scope.focusMeIf) {
                $timeout(function() {
                    element[0].focus();
                });
            }
        }
    };
})

.filter('htmlToPlaintext', function() {
    return function(text) {
        var newtext = text ? String(text).replace(/<[^>]+>/gm, '\n') : '';
        return newtext.replace(/\&nbsp;/g, '').replace(/\&gt;-/g, '').replace(/\&lt;-/g, '');
    };
})

.directive('notification', ['$timeout', function($timeout) {
    return {
        restrict: 'E',
        template: "<div class='popup-error alert alert-{{alertData.type}}' ng-show='alertData.message' role='alert' data-notification='{{alertData.status}}'>{{alertData.message}}</div>",
        scope: {
            alertData: "="
        },
        replace: true
    };
}])
.directive('restrictField', function() {
    return {
        restrict: 'AE',
        scope: {
            restrictField: '='
        },
        link: function(scope) {
                // this will match spaces, tabs, line feeds etc
                // you can change this regex as you want
                var regex = /\s/g;

                scope.$watch('restrictField', function(newValue, oldValue) {
                    if (newValue != oldValue && regex.test(newValue)) {
                        scope.restrictField = newValue.replace(regex, '');
                    }
                });
            }
        };
    })



.directive("limitTo", [function() {
    return {
        restrict: "A",
        link: function(scope, elem, attrs) {
            var limit = parseInt(attrs.limitTo);
            angular.element(elem).on("keypress", function(e) {
                if (this.value.length == limit) e.preventDefault();
            });
        }
    }
}])

.filter('cut', function() {
    return function(value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace !== -1) {
                //Also remove . and , so its gives a cleaner result.
                if (value.charAt(lastspace - 1) === '.' || value.charAt(lastspace - 1) === ',') {
                    lastspace = lastspace - 1;
                }
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
})

.directive('uiSelectRequired', function() {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$validators.uiSelectRequired = function(modelValue, viewValue) {
                var determineVal;
                if (angular.isArray(modelValue)) {
                    determineVal = modelValue;
                } else if (angular.isArray(viewValue)) {
                    determineVal = viewValue;
                } else {
                    return false;
                }

                return determineVal.length > 0;
            };
        }
    };
})


.filter('minLength', function() {
    return function(input, len, pad) {
        input = input.toString();
        if (input.length >= len) return input;
        else {
            pad = (pad || 0).toString();
            return new Array(1 + len - input.length).join(pad) + input;
        }
    };
})
.filter('dateToISO', function() {
    return function(input) {
        input = new Date(input).toISOString();
        return input;
    };
})
.filter('htmlToPlaintext', function() {
    return function(text) {
        var newtext = text ? String(text).replace(/<[^>]+>/gm, '\n') : '';
        return newtext.replace(/\&nbsp;/g, '').replace(/\&gt;-/g, '').replace(/\&lt;-/g, '');
    };
})
.directive('myEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if (event.which === 13) {
                scope.$apply(function() {
                    scope.$eval(attrs.myEnter);
                });
                event.preventDefault();
            }
        });
    };
})

.directive('validNumber', function() {
    return {
        require: '?ngModel',
        link: function(scope, element, attrs, ngModelCtrl) {
            if (!ngModelCtrl) {
                return;
            }

            ngModelCtrl.$parsers.push(function(val) {
                if (angular.isUndefined(val)) {
                    var val = '';
                }

                var clean = val.replace(/[^-0-9\.]/g, '');
                var negativeCheck = clean.split('-');
                var decimalCheck = clean.split('.');
                if (!angular.isUndefined(negativeCheck[1])) {
                    negativeCheck[1] = negativeCheck[1].slice(0, negativeCheck[1].length);
                    clean = negativeCheck[0] + '-' + negativeCheck[1];
                    if (negativeCheck[0].length > 0) {
                        clean = negativeCheck[0];
                    }

                }

                if (!angular.isUndefined(decimalCheck[1])) {
                    decimalCheck[1] = decimalCheck[1].slice(0, 2);
                    clean = decimalCheck[0] + '.' + decimalCheck[1];
                }

                if (val !== clean) {
                    ngModelCtrl.$setViewValue(clean);
                    ngModelCtrl.$render();
                }
                return clean;
            });

            element.bind('keypress', function(event) {
                if (event.keyCode === 32) {
                    event.preventDefault();
                }
            });
        }
    };
})

.directive('numbersOnly', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                if (text) {
                    var transformedInput = text.replace(/[^0-9]/g, '');

                    if (transformedInput !== text) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                    return transformedInput;
                }
                return undefined;
            }
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
})

.directive('keypressEvents', ['$rootScope', '$document', function($rootScope, $document) {
    return {
        restrict: 'A',
        link: function() {
            $document.bind('keyup', function(e) {
                if (e.originalEvent.keyCode == 27) {
                    $rootScope.screenzoomed = false;
                    $rootScope.$root.myFunction();
                }
            });
        }
    }
}])

.directive('validlatitude', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attributes, control) {
            control.$validators.validlatitude = function(modelValue, viewValue) {
                var latitude = Number(viewValue);
                return isFinite(latitude) && Math.abs(latitude) <= 90;
            };
        }
    };
})

.directive('testDirective', function() {
    return {
        link: function(scope,elem,attrs) {
            angular.element(elem).on('click', function (evt) {
                alert('You clicked on: ' + scope.vm.viewDate)
            });
        }
    };
})

.directive('validlongitude', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attributes, control) {
            control.$validators.validlongitude = function(modelValue, viewValue) {
                var longitude = Number(viewValue);
                return isFinite(longitude) && Math.abs(longitude) <= 180;
            };
        }
    };
})

.directive('parseStyle', function($interpolate) {
    return function(scope, elem) {
        var exp = $interpolate(elem.html()),
        watchFunc = function() {
            return exp(scope);
        };

        scope.$watch(watchFunc, function(html) {
            elem.html(html);
        });
    };
});