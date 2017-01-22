import Restful from './restful';

angular.module('restful-ng', [])
.provider('RestfulNg', function RestfulNgProvider() {
  const options = {
    root: '',
    headers: {},
    config: {},
  };
  this.config = function config(userOptions) {
    Object.assign(options, userOptions);
  };
  this.$get = [
    '$http',
    '$q',
    function ($http, $q) {
      const fetch = (url, init) => $http({
        url,
        method: init.method,
        params: init.params,
        headers: init.headers,
        data: init.body,
      });
      Restful.init(fetch, $q);
      const restful = new Restful(options);
      // $http handles with what posthandlers do
      restful.posthandlers = [];
      return restful;
    },
  ];
});
