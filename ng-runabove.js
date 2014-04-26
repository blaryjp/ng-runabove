/**
 * ngRunabove: Angular Service for RunAbove API
 *
 * @author Jean-Philippe Blary (@blary_jp)
 * @url https://github.com/blaryjp/ng-runabove
 * @licence MIT
 */

angular.module('ngRunabove', []);

angular.module('ngRunabove').provider('Runabove', function () {
    'use strict';

    var baseUrl = 'https://manager.runabove.com/api/1.0';

    var accessRules = [
        {
            'method' : 'GET',
            'path'   : '/*'
        }, {
            'method' : 'POST',
            'path'   : '/*'
        }, {
            'method' : 'PUT',
            'path'   : '/*'
        }, {
            'method' : 'DELETE',
            'path'   : '/*'
        }
    ];

    var keys = {
        ak: '',    // Application Key
        as: '',    // Application Secret key
        ck: ''     // Consumer Key
    };

    /*==========  CONF  ==========*/

    this.setBaseUrl = function (url) {
        baseUrl = url;
    };

    this.setAppKey = function (ak) {
        keys.ak = ak;
    };

    this.setAppSecret = function (as) {
        keys.as = as;
    };

    this.setConsumerKey = function (ck) {
        keys.ck = ck;
        localStorage.setItem('runabove-ck', ck);
    };

    this.setAccessRules = function (rules) {
        accessRules = rules;
    };


    /*==========  PROVIDER  ==========*/

    this.$get = ['$http', '$q', function ($http, $q) {

        // At init, get CK if present
        keys.ck = localStorage.getItem('runabove-ck');


        /*==========  LOGIN  ==========*/

        function login (urlToRedirect) {

            // Delete old CK, if logged
            if (isLogged()) {
                localStorage.removeItem('runabove-ck');
                keys.ck = null;
            }

            return $http({
                method  : 'POST',
                url     : baseUrl + '/auth/credential',
                headers : {
                    'X-Ra-Application' : keys.ak
                },
                data    : {
                    accessRules : accessRules,
                    redirection : urlToRedirect
                }
            }).then(function (data) {

                // Consumer Key!
                keys.ck = data.data.consumerKey;

                // Save it to localStorage
                localStorage.setItem('runabove-ck', keys.ck);

                // Redirect to Auth page
                window.location = data.data.validationUrl;

            }, function (error) {
                return $q.reject(error);
            });
        }


        /*==========  LOGOUT  ==========*/

        function logout () {

            // If we're not logged: exit
            if (!isLogged()) {
                return $q.reject({ data : { errorCode: 'NOT_CREDENTIAL', message: 'You\'re not logged.' } });
            }

            return getApiTimeDiff().then(function (diff) {
                return $http({
                    method  : 'POST',
                    url     : baseUrl + '/auth/logout',
                    headers : getHeaders({
                        method : 'POST',
                        url    : baseUrl + '/auth/logout',
                        body   : '',
                        diff   : diff
                    })
                }).then(function () {
                    // Delete old CK
                    localStorage.removeItem('runabove-ck');
                    keys.ck = null;
                }, function (error) {
                    // Delete old CK
                    localStorage.removeItem('runabove-ck');
                    keys.ck = null;
                    return $q.reject(error);
                });
            }, function (error) {
                return $q.reject(error);
            });
        }


        /*==========  REQUEST  ==========*/

        function request (config) {

            if (!isLogged() && !config.noAuthentication) {
                return $q.reject({ data : { errorCode: 'NOT_CREDENTIAL', message: 'You\'re not logged.' } });
            }

            return getApiTimeDiff().then(function (diff) {

                // Based on a great idea of @gierschv
                if (config.params && ~config.url.indexOf('{')) {
                    angular.forEach(config.params, function (paramVal, paramKey) {
                        if ((new RegExp('{' + paramKey + '}')).test(config.url)) {
                            config.url = config.url.replace('{' + paramKey + '}', paramVal);
                            delete config.params[paramKey];
                        }
                    });
                }

                config.headers = config.noAuthentication ? getHeaders() : getHeaders({
                    method : config.method,
                    url    : config.url,
                    body   : config.body || '',
                    diff   : diff
                });


                return $http(config).then(function (data) {

                    // Returns datas only
                    return data.data;

                }, function (error) {
                    return $q.reject(error);
                });

            }, function (error) {
                return $q.reject(error);
            });
        }

        function getSchema (schemaPath) {
            return $http({
                method  : 'GET',
                url     : baseUrl + schemaPath,
                cache   : true,
                headers : getHeaders()
            }).then(function (data) {
                return data.data;
            }, function (error) {
                return $q.reject(error);
            });
        }

        function getModels (schemaPath, name) {
            return getSchema(schemaPath).then(function (schema) {
                if (!name) {
                    return schema.models;
                }
                return schema.models[name] ? schema.models[name] : $q.reject({ data : { errorCode: 'NOT_FOUND', message: 'Schema not found.' } });
            }, function (error) {
                return $q.reject(error);
            });
        }


        /*==========  COMMON  ==========*/

        function isLogged () {
            return !!keys.ck;
        }

        function getApiTimeDiff () {
            return $http({
                method  : 'GET',
                url     : baseUrl + '/time',
                cache   : true,
                headers : getHeaders()
            }).then(function (data) {

                return Math.floor(Date.now() / 1000) - data.data;

            }, function (error) {
                return $q.reject(error);
            });
        }

        function signRequest (opts) {
            return '$1$' + SHA1([keys.as, keys.ck, opts.method, opts.url, opts.body, opts.diff].join('+'));
        }

        function getHeaders (opts) {
            if (!opts) {
                return {
                    'Content-Type' : 'application/json;charset=utf-8'
                };
            } else {
                var diff = (Math.floor(Date.now() / 1000) - opts.diff).toString();
                return {
                    'Content-Type'     : 'application/json;charset=utf-8',
                    'X-Ra-Application' : keys.ak,
                    'X-Ra-Consumer'    : keys.ck,
                    'X-Ra-Timestamp'   : diff,
                    'X-Ra-Signature'   : signRequest({
                        method : opts.method,
                        url    : opts.url,
                        body   : opts.body,
                        diff   : diff
                    })
                };
            }
        }

        /**
         *
         *  Secure Hash Algorithm (SHA1)
         *  http://www.webtoolkit.info/
         *
         **/
        /* jshint ignore:start */
        function SHA1 (msg) {

            function rotate_left(n,s) {
                var t4 = ( n<<s ) | (n>>>(32-s));
                return t4;
            }

            function lsb_hex(val) {
                var str='';
                var i;
                var vh;
                var vl;

                for( i=0; i<=6; i+=2 ) {
                    vh = (val>>>(i*4+4))&0x0f;
                    vl = (val>>>(i*4))&0x0f;
                    str += vh.toString(16) + vl.toString(16);
                }
                return str;
            }

            function cvt_hex(val) {
                var str='';
                var i;
                var v;

                for( i=7; i>=0; i-- ) {
                    v = (val>>>(i*4))&0x0f;
                    str += v.toString(16);
                }
                return str;
            }

            function Utf8Encode(string) {
                string = string.replace(/\r\n/g,'\n');
                var utftext = '';

                for (var n = 0; n < string.length; n++) {

                    var c = string.charCodeAt(n);

                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    }
                    else if((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                    else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }

                }

                return utftext;
            }

            var blockstart;
            var i, j;
            var W = new Array(80);
            var H0 = 0x67452301;
            var H1 = 0xEFCDAB89;
            var H2 = 0x98BADCFE;
            var H3 = 0x10325476;
            var H4 = 0xC3D2E1F0;
            var A, B, C, D, E;
            var temp;

            msg = Utf8Encode(msg);

            var msg_len = msg.length;

            var word_array = new Array();
            for( i=0; i<msg_len-3; i+=4 ) {
                j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
                msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
                word_array.push( j );
            }

            switch( msg_len % 4 ) {
                case 0:
                    i = 0x080000000;
                break;
                case 1:
                    i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
                break;

                case 2:
                    i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
                break;

                case 3:
                    i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8    | 0x80;
                break;
            }

            word_array.push( i );

            while( (word_array.length % 16) != 14 ) word_array.push( 0 );

            word_array.push( msg_len>>>29 );
            word_array.push( (msg_len<<3)&0x0ffffffff );


            for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {

                for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
                for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);

                A = H0;
                B = H1;
                C = H2;
                D = H3;
                E = H4;

                for( i= 0; i<=19; i++ ) {
                    temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B,30);
                    B = A;
                    A = temp;
                }

                for( i=20; i<=39; i++ ) {
                    temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B,30);
                    B = A;
                    A = temp;
                }

                for( i=40; i<=59; i++ ) {
                    temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B,30);
                    B = A;
                    A = temp;
                }

                for( i=60; i<=79; i++ ) {
                    temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B,30);
                    B = A;
                    A = temp;
                }

                H0 = (H0 + A) & 0x0ffffffff;
                H1 = (H1 + B) & 0x0ffffffff;
                H2 = (H2 + C) & 0x0ffffffff;
                H3 = (H3 + D) & 0x0ffffffff;
                H4 = (H4 + E) & 0x0ffffffff;

            }

            var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);

            return temp.toLowerCase();

        }
        /* jshint ignore:end */

        var fcts = {
            login     : login,
            logout    : logout,
            isLogged  : isLogged,
            getSchema : getSchema,
            getModels : getModels
        };

        angular.forEach(['get', 'put', 'post', 'delete', 'remove', 'del'], function (name) {
            fcts[name] = function (url, config) {
                return request(angular.extend(config || {}, {
                    method : ((name === 'remove' || name === 'del') ? 'delete' : name).toUpperCase(),
                    url    : baseUrl + url
                }));
            };
        });

        return fcts;

    }];
});
