'use strict';

angular.module('api.bountysource',[]).
  service('$api', function($http, $q, $cookieStore, $rootScope, $location, $window) {
    var api_host = "https://api.bountysource.com/";
    // environment
    $rootScope.environment = $cookieStore.get('environment') || 'prod';
    if ($rootScope.environment === 'dev') {
      api_host = "http://api.bountysource.dev/";
    } else if ($rootScope.environment === 'qa') {
      api_host = "https://api-qa.bountysource.com/";
    }

    this.setEnvironment = function(env) {
      $cookieStore.put('environment', env);
      window.location.reload();
    };

    // call(url, 'POST', { foo: bar }, optional_callback)
    this.call = function() {
      // parse arguments
      var args = Array.prototype.slice.call(arguments);
      var url = api_host + args.shift().replace(/^\//,'');
      var method = typeof(args[0]) === 'string' ? args.shift() : 'GET';
      var params = typeof(args[0]) === 'object' ? args.shift() : {};
      var callback = typeof(args[0]) === 'function' ? args.shift() : function(response) { return response.data; };

      // merge in params
      params.callback = 'JSON_CALLBACK';
      params._method = method;
      if ($cookieStore.get('access_token')) {
        params.access_token = $cookieStore.get('access_token');
      }

      // deferred JSONP call with a promise
      var deferred = $q.defer();
      $http.jsonp(url, { params: params }).success(function(response) {
        deferred.resolve(callback(response));
      });
      return deferred.promise;
    };

    this.fundraiser_cards = function() {
      return this.call("/fundraisers/cards", function(r) { return r.data.in_progress.concat(r.data.completed); });
    };

    this.fundraiser_get = function(id) {
      return this.call("/user/fundraisers/"+id);
    };

    this.fundraiser_update = function(id, data) {
      return this.call("/user/fundraisers/"+id, "PUT", data);
    };

    this.fundraiser_create = function(data) {
      return this.call("/user/fundraisers", "POST", data);
    };

    this.fundraiser_pledges_get = function(id) {
      return this.call("/user/fundraisers/"+id+"/pledges");
    };

    this.fundraiser_update_get = function(fundraiser_id, id) {
      return this.call("/user/fundraisers/"+fundraiser_id+"/updates/"+id);
    };

    this.people_recent = function() {
      return this.call("/user/recent");
    };

    this.person_get = function(id) {
      return this.call("/users/"+id);
    };

    this.person_timeline_get = function(id) {
      return this.call("/users/"+id+"/activity");
    };

    this.project_cards = function() {
      return this.call("/trackers/cards", function(r) { return r.data.featured_trackers.concat(r.data.all_trackers); });
    };

    this.tracker_get = function(id) {
      return this.call("/trackers/"+id+"/overview");
    };

    this.issue_get = function(id) {
      return this.call("/issues/"+id);
    };


    // these should probably go in an "AuthenticationController" or something more angular

    this.signin = function(email, password) {
      var that = this;
      return this.call("/user/login", "POST", { email: email, password: password }, function(response) {
        console.log(response);
        if (response.meta.status === 200) {
          $rootScope.current_person = response.data;
          $cookieStore.put('access_token', $rootScope.current_person.access_token);
          that.after_signin(response);
        }
      });
    };

    this.signin_with_access_token = function(access_token) {
      var deferred = $q.defer();
      var that = this;
      this.call("/user", { access_token: access_token }, function(response) {
        if (response.meta.status === 200) {
          $rootScope.current_person = response.data;
          // TODO: why doesn't /user return an access_token like /user/login ?
          $rootScope.current_person.access_token = access_token;
          $cookieStore.put('access_token', $rootScope.current_person.access_token);
          deferred.resolve(true);
          that.after_signin(response);
        } else {
          deferred.resolve(false);
        }
      });
      return deferred.promise;
    };

    this.after_signin = function(response) {
      // is there a stored redirect URL? go to it!
      // otherwise, just land on root page
      if ($cookieStore.get('postauth_url')) {
        var url = $cookieStore.get('postauth_url');
        $cookieStore.remove('postauth_url');
        $window.location = url;
      } else {
        $location.path("/");
      }
    };

    this.verify_access_token = function() {
      var access_token = $cookieStore.get('access_token');
      if (access_token) {
        console.log("Verifying access token: " + access_token);
        var that = this;
        this.call("/user", { access_token: access_token }, function(response) {
          if (response.meta.status === 200) {
            console.log("access token still valid");
            $rootScope.current_person = response.data;
          } else {
            console.log("access token expired. signing out.");
            that.signout();
          }
        });
      }
    };

    this.signin_url_for = function(provider) {
      // todo, include redirect_url in callback
      return api_host.replace(/\/$/,'') + '/auth/' + provider + '?redirect_url=' + encodeURIComponent('http://localhost:9000/signin/callback?provider='+provider);
    };

    this.signout = function() {
      $rootScope.current_person = null;
      $cookieStore.remove('access_token');
      $location.path("/");
    };

    this.process_payment = function(current_scope, data) {
      var that = this;

      return this.call("/payments", "POST", data, function(response) {
        if (response.meta.success) {
          if (data.payment_method == 'google') {
            // a JWT is returned, trigger buy
            $window.google.payments.inapp.buy({
              jwt: response.data.jwt,
              success: function(result) {
                console.log('Google Wallet: Great Success!', result);
                that.call("/payments/google/success?access_token="+$cookieStore.get('access_token')+"&order_id="+result.response.orderId);
              },
              failure: function(result) {
                console.log('Google Wallet: Error', result);
              }
            });
          } else if (data.payment_method == 'personal') {

            console.log('TODO Update personal account balance');

          } else {
            $window.location = response.data.redirect_url;
          }
        } else if (response.meta.status == 401) {
          $cookieStore.put('postauth_url', data.postauth_url);
          $location.path('/signin');
        } else {
          current_scope.payment_error = response.data.error;
        }
      });
    };

  });