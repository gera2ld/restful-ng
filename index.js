/**
 * @desc    RESTful service for Angular 1.x
 * @author  Gerald <i@gerald.top>
 */
!function () {
angular.module('restful-ng', [])
.provider('RestfulNg', RestfulNgProvider);

function RestfulNgProvider() {
  var options = {
    root: '',
    headers: {},
    prehandlers: [],
    posthandlers: [],
    errhandlers: [function (res) {throw res;}],
    presets: [],
  };
  this.config = function (userOptions) {
    Object.assign(options, userOptions);
  };
  this.$get = [
    '$http',
    '$q',
    function ($http, $q) {
      return initRestful($http, $q)(options);
    },
  ];
}

function initRestful($http, $q) {
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var RE_SLASHES = /^\/|\/$/g;
var RE_ABSURL = /^[\w-]+:/;
var RE_PLACEHOLDER = /\/:([^/]*)/g;

function Model(restful, path) {
  if (!(this instanceof Model)) return new Model(restful, path);
  this.restful = restful;
  this.prehandlers = [];
  this.posthandlers = [];
  this.overrides = null;
  this.parameters = null;
  this._setPath(path);
}
Object.assign(Model.prototype, {
  _setPath: function _setPath(path) {
    var _this = this;

    if (path) {
      path = path.replace(RE_SLASHES, '').split('/').filter(function (c) {
        return c;
      }).map(function (comp) {
        if (!comp) {
          throw new Error('Invalid path!');
        }
        if (comp[0] === ':') {
          _this._addParam(comp.slice(1));
        }
        return comp;
      }).join('/');
      if (path) path = '/' + path;
    }
    this.path = path || '';
  },
  _addParam: function _addParam(name) {
    var parameters = this.parameters = this.parameters || {};
    if (parameters[name]) {
      throw new Error('Invalid path: parameter "' + name + '" already exists!');
    }
    parameters[name] = true;
  },
  request: function request(options) {
    var _this2 = this;

    if (this.parameters) {
      throw new Error('Abstract model cannot be requested!');
    }
    return this.restful._processHandlers(this.prehandlers, options, function (options, handler) {
      return Object.assign({}, options, handler(options));
    }).then(function (options) {
      var url = options.url || '';
      if (!RE_ABSURL.test(url)) {
        if (url && url[0] !== '/') url = '/' + url;
        url = _this2.restful.root + _this2.path + url;
      }
      options.url = url;
      return _this2.restful._request(options, _this2.overrides);
    }).then(function (res) {
      return _this2.restful._processHandlers(_this2.posthandlers, res);
    });
  },
  get: function get(url, params) {
    return this.request({
      method: 'GET',
      url: url, params: params
    });
  },
  post: function post(url, body, params) {
    return this.request({
      method: 'POST',
      url: url, params: params, body: body
    });
  },
  put: function put(url, body, params) {
    return this.request({
      method: 'PUT',
      url: url, params: params, body: body
    });
  },
  remove: function remove(url, params) {
    return this.request({
      method: 'DELETE',
      url: url, params: params
    });
  },
  model: function model() {
    for (var _len = arguments.length, comp = Array(_len), _key = 0; _key < _len; _key++) {
      comp[_key] = arguments[_key];
    }

    var path = comp.filter(function (comp) {
      return comp;
    }).join('/');
    if (path) path = '/' + path;
    return new Model(this.restful, this.path + path);
  },
  fill: function fill(data) {
    var path = this.path.replace(RE_PLACEHOLDER, function (match, key) {
      var value = data[key];
      return value ? '/' + value : match;
    });
    var model = new Model(this.restful, path);
    model.prehandlers = this.prehandlers;
    model.posthandlers = this.posthandlers;
    return model;
  }
});

function Restful(options) {
  var _this = this;

  if (!(this instanceof Restful)) return new Restful(options);
  options = options || {};
  this.root = options.root || '';
  this.headers = Object.assign({}, options.headers);
  this.prehandlers = [];
  this.posthandlers = [function (res) {
    if (res.status > 300) throw res;
    return res;
  }];
  this.errhandlers = [function (res) {
    throw res;
  }];
  (options.presets || []).forEach(function (name) {
    var preset = _this['preset' + name.toUpperCase()];
    preset && preset.call(_this);
  });
  this.rootModel = new Model(this, '');
  ['model', 'request', 'get', 'post', 'put', 'remove'].forEach(function (method) {
    _this[method] = _this.rootModel[method].bind(_this.rootModel);
  });
}
Object.assign(Restful.prototype, {
  presetJSON: function presetJSON() {
    Object.assign(this.headers, {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });
    this.prehandlers.push(function (request) {
      return {
        body: request.body ? JSON.stringify(request.body) : null
      };
    });
    this.posthandlers.push(function (res) {
      return res.status === 204 ? null : res.json();
    });
    this.errhandlers.unshift(function (res) {
      return res.json().then(function (data) {
        return {
          status: res.status,
          data: data
        };
      });
    });
  },
  setHeader: function setHeader(key, val) {
    if (val == null) {
      delete this.headers[key];
    } else {
      this.headers[key] = val;
    }
  },
  setHeaders: function setHeaders(pairs) {
    for (var key in pairs) {
      this.setHeader(key, pairs[key]);
    }
  },
  _processHandlers: function _processHandlers(handlers, value, cb) {
    if (!cb) cb = function cb(value, handler) {
      return handler(value);
    };
    return handlers.reduce(function (promise, handler) {
      return promise.then(function (value) {
        return cb(value, handler);
      });
    }, $q.resolve(value));
  },
  _prepareRequest: function _prepareRequest(options, overrides) {
    var method = options.method;
    var url = options.url;
    var params = options.params;
    var body = options.body;
    var headers = options.headers;

    var request = {
      url: url,
      method: method,
      params: params,
      body: body,
      headers: Object.assign({}, this.headers, headers)
    };
    return this._processHandlers(overrides && overrides.prehandlers || this.prehandlers, request, function (request, handler) {
      return Object.assign({}, request, handler(request));
    });
  },
  _fetch: function _fetch(request) {
    return $http({
      url: request.url,
      method: request.method,
      params: request.params,
      data: request.body,
      headers: request.headers,
    });
  },
  _request: function _request(options, overrides) {
    var _this2 = this;

    return this._prepareRequest(options, overrides).then(function (request) {
      return _this2._fetch(request);
    }).then(function (res) {
      return _this2._processHandlers(overrides && overrides.posthandlers || _this2.posthandlers, res);
    }).catch(function (res) {
      return _this2._processHandlers(overrides && overrides.errhandlers || _this2.errhandlers, res);
    });
  }
});

return Restful;
}
}();