# restful-ng

This is a RESTful service for Angular 1.x.

APIs are consistent with [restful-fetch](https://github.com/gera2ld/restful-fetch).

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
