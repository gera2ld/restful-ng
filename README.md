# restful-ng

![Bower](https://img.shields.io/bower/v/restful-ng.svg)
![NPM](https://img.shields.io/npm/v/restful-ng.svg)
![Downloads](https://img.shields.io/npm/dt/restful-ng.svg)

This is a RESTful service for Angular 1.x.

APIs are consistent with [restful-fetch](https://github.com/gera2ld/restful-fetch).

Installation
---
``` sh
$ bower install restful-ng
# Or
$ npm install restful-ng
```

Usage
---
``` js
angular.module('app', ['restful-ng'])
.config([
  'RestfulNgProvider',
  function (RestfulProvider) {
    RestfulProvider.config({
      root: '/api',
      presets: ['json'],
    });
  }
])
.run([
  'RestfulNg',
  function (RestfulNg) {
    RestfulNg.get('/hello').then(function (data) {
      console.log(data);
    });

    var myCar = RestfulNg.model('cars/1');
    myCar.get().then(function (data) {
      console.log(data);
    });
  }
]);
```
