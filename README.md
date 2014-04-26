ng-runabove
===========

Angular service for the [RunAbove](https://www.runabove.com) API.

  - Simple to use
  - Well documented
  - Only 1.9KB minified and gzipped!

The Runabove API Console is available [here](https://manager.runabove.com/console).


Installation
------------

You can download it with Bower:
```bash
$ bower install ng-runabove --save
```
And include the script in your html:
```html
<script src="components/ng-runabove/ng-runabove.min.js"></script>
```


Configuration
-------------

Simply add the dependency in your Angular app, like this:

```javascript
var myApp = angular.module('myApp', [
    'ngRunabove'    // Require the ngRunabove module here
]);
```

After that, you can configure it via the RunaboveProvider:

```javascript
myApp.config(function (RunaboveProvider) {

    // Set the Application Key (AK):
    RunaboveProvider.setAppKey('YOUR_APPLICATION_KEY');

    // Set the Application Secret (AS):
    RunaboveProvider.setAppSecret('YOUR_APPLICATION_SECRET');

    // [... other options]

});
```

#### Options

* **setAppKey**("AK") : Set the Application Key (AK).
* **setAppSecret**("AS") : Set the Application Secret (AS).
* setConsumerKey("CK") : Set the Consumer Key (CK).
* setBaseUrl("URL") : Set the API base URL.
* setAccessRules([{ ... }]) : Set the access rules.

The Application Key (AK) and the Application Secret (AS) is mandatory.

#### Get an Application Key (AK) and an Application Secret (AS)

In order to use the API, you need to create a third party application in RunAbove.
Go to [this link](https://manager.runabove.com/api/createApp/), and follow the steps. It will give you an AK and an AS to use for your application.

You can find more informations [here](https://api.ovh.com/g934.first_step_with_api).


Usage
-----

@todo


Examples
--------

You can find examples in the "examples" folder.


License
-------

MIT


Note
----

This library is not maintained by Runabove or OVH team.

