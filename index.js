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
    function ($http) {

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
  prepareRequest: function (options) {
    var _this = this;
    var request = {
      url: options.url,
      method: options.method,
      headers: _.assign({}, _this.headers, options.headers),
      data: options.body,
      params: options.params,
    };
    return _this.prehandlers.reduce(function (request, handler) {
      return _.assign({}, request, handler(request));
    }, request);
  },
  _request: function (options) {
    var _this = this;
    var request = _this.prepareRequest(options);
    return $http(request)
    .then(function (res) {
      return _this.posthandlers.reduce(function (res, handler) {
        return handler(res);
      }, res);
    }, function (res) {
      return _this.errhandlers.reduce(function (res, handler) {
        return handler(res);
      }, res);
    });
  },
};

function Model(restful, path) {
  var _this = this;
  _this.restful = restful;
  _this.path = path || '';
  _this.prehandlers = [];
  _this.posthandlers = [];
}
Model.prototype = {
  request: function (options) {
    var _this = this;
    options = _this.prehandlers.reduce(function (options, handler) {
      return _.assign({}, options, handler(options));
    }, options);
    var url = options.url || '';
    if (!url || url[0] === '/') options.url = _this.path + url;
    return _this.restful._request(options)
    .then(function (res) {
      return _this.posthandlers.reduce(function (res, handler) {
        return handler(res);
      }, res);
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
  model: function (path) {
    path = (path || '').replace(/\/$/, '');
    if (!path) {
      throw new Error('Invalid path: path cannot be empty!');
    }
    if (path[0] !== '/') path = '/' + path;
    return new Model(this.restful, this.path + path);
  },
};

// ************** Module end **************

      return new Restful(options);
    },
  ];
});
