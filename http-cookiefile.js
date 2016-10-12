/**
 * Created by horat1us on 09.10.16.
 */
"use strict";
module.exports = {
    Cookie: class Cookie {
        constructor({domain, httpOnly = false, crossDomain = false, path = '/', https = false, expire = 0, name, value}) {
            if (!(expire instanceof Date || require('isnumeric')(expire))) {
                throw new module.exports.CookieError();
            }
            this.domain = domain;
            this.crossDomain = crossDomain;
            this.path = path;
            this.https = https;
            this.expire = ~~expire ? ~~expire : 0;
            this.value = value;
            this.cookieName = name;
            this.httpOnly = httpOnly
        }

        /** @return {String} */
        get name() {
            return this.cookieName;
        }

        get isCrossDomain() {
            return this.crossDomain.toString().toUpperCase();
        }

        get isHttps() {
            return this.https.toString().toUpperCase();
        }

        /**
         * @return {Cookie}
         */
        clone() {
            return new Cookie(this);
        }

        /** @return {String} */
        toString() {
            let _this = this,
                string = this.httpOnly ? "#HttpOnly_" : "";
            ['domain', 'isCrossDomain', 'path', 'isHttps', 'expire', 'name', 'value']
                .forEach(prop => string += _this[prop] + '\t');
            return string.trim() + '\n';
        }

        toHeader() {
            return `${this.name}=${this.value}; `;
        }

        toResponseHeader() {

            return `Set-Cookie: ${this.name}=${this.value}; ` +
                [['Domain', 'domain'], ['Path', 'path']]
                    .map(([name, prop]) => `${name}=${this[prop]}`)
                    .join('; ') + '; ' +
                `expires=${new Date(this.expire).toUTCString()}; ` +
                [['Secure', 'https'], ['HttpOnly', 'httpOnly']]
                    .filter(([,property]) => this[property])
                    .map(([name]) => ` ${name}`)
                    .join('; ');
        }

        /**
         * @param {Cookie} cookie
         * @return {Boolean}
         */
        is(cookie) {
            for (let prop in ['domain', 'crossDomain', 'path', 'https', 'expire', 'name', 'value']) {
                if (this[prop] !== cookie[prop]) {
                    return false;
                }
            }
            return true;
        }
    },
    CookieMap: class CookieMap extends Map {
        constructor(file = []) {
            if (Array.isArray(file)) {
                super();
                file.forEach(cookie => {
                    if (!(cookie instanceof module.exports.Cookie)) {
                        throw new module.exports.CookieError(4);
                    }
                    this.set(cookie);
                });
                this.file = false;
            } else if (typeof(file) === 'string') {
                super();
                this.file = file;
                return this.readFile();
            } else {
                throw new TypeError("Wrong argument supplied for CookieMap construtor");
            }
        }

        /**
         * @param {String} header HTTP Header like Set-Cookie: ...
         * @return {CookieMap}
         */
        header(header) {
            if (!CookieMap.validateHeader(header)) {
                return this;
            }
            let CookieInfo = {};
            header
                .replace('Set-Cookie: ', '')
                .split(';')
                .map(
                    part => {
                        let parts = part
                            .trim()
                            .split('=');
                        if(parts.length == 1)
                        {
                            return parts;
                        }
                        parts = [parts[0], (part.replace(`${parts[0]}=`, ''))];
                        return parts;
                    }
                )
                .map(parts => parts.map(part => part.trim()))
                .filter(part => {
                    if (part.length === 2) {
                        return true;
                    }
                    switch (part[0]) {
                        case "Secure":
                            CookieInfo.https = true;
                            break;
                        case "HttpOnly":
                            CookieInfo.httpOnly = true;
                            break;
                    }
                    return false;
                })
                .forEach(([name, value]) => {
                    switch (name.toLowerCase()) {
                        case "domain":
                            return CookieInfo.domain = value;
                        case "path":
                            return CookieInfo.path = value;
                        case "expires":
                            return CookieInfo.expire = new Date(value);
                        case "same-Site":
                        case "max-Age":
                            // TODO: Integrate support for Max-Age and Same-Site directives
                            return;
                        default:
                            CookieInfo.name = name;
                            CookieInfo.value = value;
                    }
                });
            ['name', 'value', 'domain']
                .forEach(prop => {
                    if (!CookieInfo.hasOwnProperty(prop)) {
                        throw new module.exports.CookieError(5);
                    }
                });

            this.set(new module.exports.Cookie(CookieInfo));

            return this;
        }

        /**
         * Takes sample HTTP Cookie and return true if set-cookie header given
         * @param {String} header HTTP Header like Set-Cookie: ...
         */
        static validateHeader(header) {
            return header
                    .trim()
                    .substr(0, 11) === "Set-Cookie:";
        }

        /**
         * @param {Cookie} cookie
         * @return {CookieMap}
         */
        set(cookie) {
            if (!(cookie instanceof module.exports.Cookie)) {
                throw new TypeError(`Cookie must be type of cookie, ${typeof(cookie)} given`);
            }
            super.set(cookie.name, cookie);

            return this;
        }

        /**
         * @return {CookieMap}
         */
        save(file = false) {
            if (file === false || typeof(file) !== 'string') {
                file = this.file;
            }
            if (file === false) {
                throw new module.exports.CookieError(2);
            }

            require('fs').writeFileSync(file, this.toString());

            return this;
        }

        /**
         * @returns {CookieMap}
         */
        clone() {
            let cookieMap = new CookieMap();
            for ([, cookie] of this) {
                cookieMap.set(cookie.clone());
            }
            return cookieMap;
        }

        toString() {
            let cookieContent = module.exports.CookieFile.Header;

            /** @var {Cookie} cookie */
            for (let cookie of this.values()) {
                cookieContent += cookie.toString();
            }

            return cookieContent.trim();
        }

        /**
         * @return {String} HTTP User header
         */
        toRequestHeader({http = true, secure = true} = {}) {
            let string = 'Cookie: ';
            /**
             * @var {String} name
             * @var {Cookie} cookie
             */
            for (let [, cookie] of this) {
                string += cookie.toHeader();
            }

            return string.replace(/;\s*$/, '');
        }

        /**
         * @return {String} HTTP Server header
         */
        toResponseHeader() {
            let headers = [];

            for (let [,cookie] of this) {
                headers.push(cookie.toResponseHeader());
            }

            return headers;
        }


        /**
         * @return {CookieMap}
         */
        readFile() {
            if (!require('file-exists')(this.file)) {
                throw new module.exports.CookieError(1);
            }
            const fs = require('fs');
            let cookieFileContents = fs.readFileSync(this.file, {encoding: 'UTF-8'})

            const cookies = cookieFileContents
                .split('\n')
                .map(line => line.split("\t").map((word) => word.trim()))
                .filter(line => line.length === 7)
                .map(cookieData => ({
                    name: cookieData[5],
                    value: cookieData[6],
                    domain: cookieData[0],
                    crossDomain: cookieData[1] === 'TRUE',
                    path: cookieData[2],
                    https: cookieData[3] === 'TRUE',
                    expire: ~~cookieData[4] ? ~~cookieData[4] : 0,
                }))
                .map(cookie => {
                    if (cookie.domain.substr(0, 10) === "#HttpOnly_") {
                        cookie.httpOnly = true;
                        cookie.domain = cookie.domain.substr(10);
                    }
                    return cookie;
                })
                .forEach(cookie => this.set(
                    new module.exports.Cookie(cookie)
                ));

            return this;
        }


        get size() {
            return super.size;
        }
    },
    CookieError: class CookieError extends Error {
        constructor(code = 0) {
            const message = (() => {
                switch (code) {
                    case 5:
                        return "Wrong header passed for creating cookie";
                    case 4:
                        return "Cookie passed to constructor is incorrect";
                    case 3:
                        return "Cookie file writing error";
                    case 2:
                        return 'You can not save this object because is initialized by Map, not file';
                    case 1:
                        return 'Cookie File doesn\'t exists';
                    default:
                        return "Cookie expire must be instance of Date or integer";
                }
            })();

            super(message);
        }
    }
    ,
    CookieFile: {
        Header: `# Netscape HTTP Cookie File
# https://curl.haxx.se/docs/http-cookies.html
# This file was generated by node-httpcookie! Edit at your own risk

`,
    }
}
;