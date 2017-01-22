(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var ARGS_WO_PAYLOAD = ['url', 'params'];
var ARGS_W_PAYLOAD = ['url', 'body', 'params'];

var methods = {
  get: {
    method: 'GET',
    args: ARGS_WO_PAYLOAD
  },
  post: {
    method: 'POST',
    args: ARGS_W_PAYLOAD
  },
  put: {
    method: 'PUT',
    args: ARGS_W_PAYLOAD
  },
  patch: {
    method: 'PATCH',
    args: ARGS_W_PAYLOAD
  },
  delete: {
    method: 'DELETE',
    args: ARGS_WO_PAYLOAD
  }
};
methods.remove = methods.delete;

function merge(obj1, obj2) {
  var deepKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  return deepKeys.reduce(function (res, key) {
    res[key] = Object.assign({}, obj1 && obj1[key], obj2 && obj2[key]);
    return res;
  }, Object.assign({}, obj1, obj2));
}

function toQueryString(params) {
  var qs = params && Object.keys(params).map(function (key) {
    var val = params[key];
    if (val == null) return;
    return encodeURIComponent(key) + '=' + encodeURIComponent(val);
  }).filter(function (i) {
    return i;
  }).join('&');
  return qs ? '?' + qs : '';
}

function processHandlers(handlers, value, cb) {
  if (typeof cb !== 'function') {
    (function () {
      var extra = cb;
      cb = function cb(value, handler) {
        return handler(value, extra);
      };
    })();
  }
  return handlers.reduce(function (promise, handler) {
    return promise.then(function (value) {
      return cb(value, handler);
    });
  }, Promise$1.resolve(value));
}

function Restful(options) {
  var _this = this;

  if (!(this instanceof Restful)) return new Restful(options);
  options = this.options = Object.assign({}, options);
  options.root = options.root || '';
  options.config = Object.assign({}, options.config);
  options.headers = Object.assign({}, options.headers);
  options.methods = Object.assign({}, methods, options.methods);
  this.prehandlers = [
  // check content-type
  function (request) {
    var body = request.body;

    if (Object.prototype.toString.call(body) === '[object FormData]') {
      return;
    }
    if (body && (typeof body === 'undefined' ? 'undefined' : _typeof(body)) === 'object') {
      return {
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      };
    }
  }];
  this.posthandlers = [
  // parse payload
  function (res) {
    return Promise$1.resolve().then(function () {
      if (res.status === 204) return {};
      var contentType = res.headers.get('content-type');
      if (/application\/json/.test(contentType)) {
        return res.json();
      } else if (/text\//.test(contentType)) {
        return res.text();
      } else {
        return res.blob();
      }
    }).then(function (data) {
      return { res: res, data: data };
    });
  },
  // return data
  function (_ref) {
    var res = _ref.res,
        data = _ref.data;

    // if (res.status > 300) throw res;
    if (res.ok) return data;
    throw { status: res.status, data: data };
  }];
  this.errhandlers = [function (i) {
    throw i;
  }];
  var root = this.root = new Model(this);
  ['model'].concat(Object.keys(options.methods)).forEach(function (method) {
    _this[method] = root[method].bind(root);
  });
}

Object.assign(Restful.prototype, {
  _prepareRequest: function _prepareRequest(options, overrides) {
    var method = options.method,
        url = options.url,
        params = options.params,
        body = options.body,
        headers = options.headers;

    var request = {
      url: url,
      method: method,
      params: params,
      body: body,
      headers: Object.assign({}, this.options.headers, headers)
    };
    return processHandlers(overrides && overrides.prehandlers || this.prehandlers, request, function (request, handler) {
      return merge(request, handler(request), ['headers']);
    });
  },
  _fetch: function _fetch(request) {
    var init = ['method', 'headers', 'body'].reduce(function (init, key) {
      var val = request[key];
      if (val != null) init[key] = val;
      return init;
    }, Object.assign({}, this.options.config));
    var url = request.url + toQueryString(request.params);
    return fetch(url, init);
  },
  _request: function _request(options, overrides) {
    var _this2 = this;

    return this._prepareRequest(options, overrides).then(function (request) {
      return _this2._fetch(request).then(function (res) {
        return processHandlers(overrides && overrides.posthandlers || _this2.posthandlers, res, request);
      });
    }).catch(function (res) {
      return processHandlers(overrides && overrides.errhandlers || _this2.errhandlers, res);
    });
  }
});

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
  this._bindMethods();
}

Object.assign(Model.prototype, {
  _setPath: function _setPath(path) {
    var _this3 = this;

    if (path) {
      path = path.replace(RE_SLASHES, '').split('/').filter(function (c) {
        return c;
      }).map(function (comp) {
        if (!comp) {
          throw new Error('Invalid path!');
        }
        if (comp[0] === ':') {
          _this3._addParam(comp.slice(1));
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
  _bindMethods: function _bindMethods() {
    var _this4 = this;

    var bindMethod = function bindMethod(key, item) {
      _this4[key] = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var options = item.args.reduce(function (res, arg, i) {
          var value = args[i];
          if (value != null) res[arg] = value;
          return res;
        }, { method: item.method });
        return _this4.request(options);
      };
    };
    var methods = this.restful.options.methods;

    methods && Object.keys(methods).forEach(function (key) {
      return bindMethod(key, methods[key]);
    });
  },
  model: function model() {
    for (var _len2 = arguments.length, parts = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      parts[_key2] = arguments[_key2];
    }

    var path = parts.filter(function (part) {
      return part;
    }).join('/');
    if (path) path = '/' + path;
    return new Model(this.restful, this.path + path);
  },
  fill: function fill(data) {
    var path = this.path.replace(RE_PLACEHOLDER, function (match, key) {
      var value = data[key];
      return value == null ? match : '/' + encodeURIComponent(value);
    });
    var model = new Model(this.restful, path);
    model.prehandlers = this.prehandlers;
    model.posthandlers = this.posthandlers;
    return model;
  },
  request: function request(options) {
    var _this5 = this;

    if (this.parameters) {
      throw new Error('Abstract model cannot be requested!');
    }
    return processHandlers(this.prehandlers, options, function (options, handler) {
      return Object.assign({}, options, handler(options));
    }).then(function (options) {
      var url = options.url || '';
      if (!RE_ABSURL.test(url)) {
        if (url && url[0] !== '/') url = '/' + url;
        options.relative = url;
        url = _this5.restful.options.root + _this5.path + url;
      } else {
        options.relative = null;
      }
      options.url = url;
      return _this5.restful._request(options, _this5.overrides).then(function (res) {
        return processHandlers(_this5.posthandlers, res, options);
      });
    });
  }
});

// patch for angular
var fetch;
var Promise$1;
Restful.init = function initRestful(_fetch, _Promise) {
  fetch = _fetch;
  Promise$1 = _Promise;
};

angular.module('restful-ng', []).provider('RestfulNg', function RestfulNgProvider() {
  var options = {
    root: '',
    headers: {},
    config: {}
  };
  this.config = function config(userOptions) {
    Object.assign(options, userOptions);
  };
  this.$get = ['$http', '$q', function ($http, $q) {
    var fetch = function fetch(url, init) {
      return $http({
        url: url,
        method: init.method,
        params: init.params,
        headers: init.headers,
        data: init.body
      });
    };
    Restful.init(fetch, $q);
    var restful = new Restful(options);
    // $http handles with what posthandlers do
    restful.posthandlers = [];
    return restful;
  }];
});

})));
