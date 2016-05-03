/**
 * @desc This is a RESTful service for Angular 1.x
 * @author Gerald <i@gerald.top>
 */
angular.module('restful-ng', [])
.provider('RestfulNg', function () {
  var options = {
    root: '',
    headers: {},
    prehandlers: [],
    posthandlers: [],
    errhandlers: [function (res) {throw res;}],
    presets: [],
  };
  this.config = function (_options) {
    _.assign(options, _options);
  };
  this.$get = [
    '$http',
    '$q',
    function ($http, $q) {

// ************** Module start **************

function Restful(options) {
  var _this = this;
  _this.root = options.root;
  _this.headers = options.headers;
  _this.prehandlers = options.prehandlers;
  _this.posthandlers = options.posthandlers;
  _this.errhandlers = options.errhandlers;
  (options.presets || []).forEach(function (name) {
    const preset = _this['preset' + name.toUpperCase()];
    preset && preset.call(_this);
  });
  _this.rootModel = new Model(_this, _this.root);
  [
    'model',
    'request',
    'get',
    'post',
    'put',
    'remove',
  ].forEach(function (method) {
    _this[method] = _this.rootModel[method].bind(_this.rootModel);
  });
}
Restful.prototype = {
  presetJSON: function () {
    var _this = this;
    _.assign(_this.headers, {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
    _this.posthandlers.push(function (res) {
      return res.data;
    });
  },
  setHeader: function (key, val) {
    if (val == null) {
      delete this.headers[key];
    } else {
      this.headers[key] = val;
    }
  },
  setHeaders: function (pairs) {
    var _this = this;
    _.forEach(pairs, function (value, key) {
      _this.setHeader(key, value);
    });
  },
  processHandlers: function (handlers, value, cb) {
    if (!cb) cb = function (value, handler) {
      return handler(value);
    };
    return handlers.reduce(function (promise, handler) {
      return promise.then(function (value) {
        return cb(value, handler);
      });
    }, $q.resolve(value));
  },
  prepareRequest: function (options, overrides) {
    var _this = this;
    var request = {
      url: options.url,
      method: options.method,
      headers: _.assign({}, _this.headers, options.headers),
      data: options.body,
      params: options.params,
    };
    return _this.processHandlers(
      overrides.prehandlers || _this.prehandlers, request,
      function (request, handler) {
        return _.assign({}, request, handler(request));
      }
    );
  },
  _request: function (options, overrides) {
    var _this = this;
    return _this.prepareRequest(options, overrides)
    .then(function (request) {
      return $http(request);
    })
    .then(function (res) {
      return _this.processHandlers(overrides.posthandlers || _this.posthandlers, res);
    })
    .catch(function (res) {
      return _this.processHandlers(overrides.errhandlers || _this.errhandlers, res);
    });
  },
};

function Model(restful, path) {
  var _this = this;
  _this.restful = restful;
  _this.path = path || '';
  _this.prehandlers = [];
  _this.posthandlers = [];
  _this.overrides = {};
}
Model.prototype = {
  request: function (options) {
    var _this = this;
    return _this.restful.processHandlers(
      _this.prehandlers, options,
      function (options, handler) {
        return _.assign({}, options, handler(options));
      }
    )
    .then(function (options) {
      var url = options.url || '';
      // Skip absolute paths
      if (!/^[\w-]+:/.test(url)) {
        if (url && url[0] !== '/') url = '/' + url;
        options.url = _this.path + url;
      }
      return _this.restful._request(options, _this.overrides);
    })
    .then(function (res) {
      return _this.restful.processHandlers(_this.posthandlers, res);
    });
  },
  get: function (url, params) {
    return this.request({
      method: 'GET',
      url: url,
      params: params,
    });
  },
  post: function (url, body, params) {
    return this.request({
      method: 'POST',
      url: url,
      body: body,
      params: params,
    });
  },
  put: function (url, body, params) {
    return this.request({
      method: 'PUT',
      url: url,
      body: body,
      params: params,
    });
  },
  remove: function (url, params) {
    return this.request({
      method: 'DELETE',
      url: url,
      params: params,
    });
  },
  model: function () {
    var path = [].slice.call(arguments)
    .map(function (path) {
      return (path || '').replace(/^\/|\/$/g, '');
    }).filter(function (path) {
      return path;
    }).join('/');
    if (path) path = '/' + path;
    return new Model(this.restful, this.path + path);
  },
};

// ************** Module end **************

      return new Restful(options);
    },
  ];
});
