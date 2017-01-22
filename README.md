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
    });
  }
])
.run([
  'RestfulNg',
  function (RestfulNg) {
    RestfulNg.get('/hello').then(function (data) {
      console.log(data);
    });

    // Models
    var myCar = RestfulNg.model('cars/1');

    // Interceptors
    myCar.posthandlers.push(function (data) {
      data.intercepted = true;
      return data;
    });

    myCar.get().then(function (data) {
      console.log(data);
    });

    // Submodels
    var licence = myCar.model('licence');

    // Placeholders
    var seats = myCar.model('seats', ':seatId');
    seats.posthandlers.push(function () {
      console.log('Got a seat');
    });
    var seat1 = seats.fill({seatId: 1});
    seat1.get().then(function (data) {
      console.log(data);
    });

    // Override global interceptors
    licence.overrides.posthandlers = [function (res) {
      return res.data;
    }];
    licence.get().then(function (text) {
      console.log(text);
    });
  }
]);
```

For more details, see documents of [restful-fetch](https://github.com/gera2ld/restful-fetch).
