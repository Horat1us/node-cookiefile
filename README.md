# node-cookiefile
Package for operating with Netscape HTTP Cookie File using Node.JS

It can read and create Netscape HTTP Cookie File like this:
```
# Netscape HTTP Cookie File
# https://curl.haxx.se/docs/http-cookies.html
# This file was generated by node-httpcookie! Edit at your own risk

#HttpOnly_horatius.pro	FALSE	/	FALSE	0	httpOnlyCookie	httponly
horatius.pro	false	/	false	0	testKey	testValue
google.com   false	/	false	0	secondKey	secondValue
```
In addition to this it can read and create HTTP Response and Request (only generate) headers:
```
Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Secure; HttpOnly
Cookie: name=value; test=horatius
```

> Max-Age and Same-Site directives is not supported in actual version
> If you are interested to use it please make pull request

## Install
```
npm install cookiefile --save
```
## Usage

#### Loading library
```javascript
let {Cookie, CookieMap, CookieError} = require('http-cookiefile')
```
#### Creating Cookie Object
It will provide JavaScript Map object with overloaded `.set` method
```javascript
let cookie = new Cookie({
    domain: ".google.com",
    name: "testKey",
    value: "textValue",
    https: false, // default
    httpOnly: false, //default
    crossDomain: false, // default
    expire: Date.now() + 600 // default: 0
});
```
#### Reading Netscape Cookiefile
You can just enter your cookiefile path to load it into Map object
```javascript
let cookieFile = new CookieMap('curl.cookiefile');
```
Or you can initialize it
```javascript
let cookieFile = new CookieFile([
    cookie // Here is array of Cookie objects
]);
```
To read from `Set-Cookie` response header please use `header` method of `CookieMap`
 ```javascript
 const cookiesParsed = new CookieMap();
 cookiesParsed.header('Set-Cookie: id=a3fWa');
 ```
 Also, you can load cookie from request header `Cookie: a=b;d=c`:
 ```javascript
 const requestParsed = new CookieMap();
 
 let options = {
     domain: ".google.com",
     secure: true,
 }; // Options, which will be send to Cookie constructor
 
 CookieMap.generate('Cookie: a=b;d=c', {htt})
 ```
#### Adding new cookies 
Overloaded Map.set method. It will get name for the row from cookie object
```javascript
cookieFile.set(cookie);
```
#### Reading values
You are able to use default **Map** methods like *get*, *has*, *clear*, and others.
```javascript
let cookieValue = cookieFile.get('testKey')
```
#### Saving NetScape Cookie file
You can specify new name for new cookiefile. If you create CookieMap using filename it will be used by default.
```javascript
cookieFile.save('new.cookiefile');
cookieFile.save(); // If you had specify filename when create object
```
#### toString methods
You are able to use *toString* methods for Cookie object
```javascript
cookie.toString()
```
will return string like
```
google.com   false	/	false	0	secondKey	secondValue
```
For CookieMap `toString` is available too

```javascript
cookieFile.toString();
```
will return string will full cookiefile

In addition to this you are able to use `toRequestHeader` and `toResponseHeader` method of `CookieMap` and `Cookie` objects:
```javascript
cookieFile.toRequestHeader({http: true, secure:false});
cookieFile.toResponseHeader();
```
It will generate something like this:
```
Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Secure; HttpOnly
Cookie: name=value; test=horatius
```
## Tests
You are able to test this package using **mocha**
```
git clone https://github.com/horat1us/node-cookiefile
cd node-cookiefile
npm install
npm test
```

