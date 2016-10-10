/**
 * Created by horat1us on 09.10.16.
 */
"use strict";
const assert = require('assert'),
    expect = require('chai').expect;

describe('Netscape HTTP Cookie File', function () {
    describe('Basic functions', function () {
        let {Cookie, CookieMap, CookieError} = require('../http-cookiefile'),
            fs = require('fs'),
            fileExists = require('file-exists'),
            newCookieMap, secondCookieMap;

        it('should correctly create and read cookie file with default cookie', () => {
            newCookieMap = new CookieMap();

            let cookies = [
                new Cookie({domain: "horatius.pro", name: "testKey", value: "testValue"}),
                new Cookie({domain: "worldoftanks.ru", name: "secondKey", value: "secondValue"}),
            ];

            cookies.forEach((cookie) => newCookieMap.set(cookie));

            newCookieMap.save('tests/writeTest.cookie');

            secondCookieMap = new CookieMap('tests/writeTest.cookie');
            expect(secondCookieMap.size).to.equal(
                cookies.length,
                "Wrong reading: read cookies count is not equal to writed count"
            );

            /** @var {Cookie} cookie */
            for (let cookie in secondCookieMap.values()) {
                let equal = false;
                /** @var {Cookie} prevCookie */
                for (let prevCookie in cookies) {
                    if (prevCookie.is(cookie)) {
                        equal = true;
                    }
                }
                if (!equal) {
                    throw new Error("One of new cookie is not in the list of first cookies");
                }
            }
        });
        it('should generate two same text files from two list of same object (different instances)', () => {
            newCookieMap.save('tests/first.cookie');
            secondCookieMap.save('tests/second.cookie');

            let filesContent = [];
            ['first.cookie', 'second.cookie']
                .map((file) => `tests/${file}`)
                .forEach(file => {
                    expect(fileExists(file)).to.equal(true, 'Cookie file is not exists');
                    filesContent.push(
                        fs.readFileSync(file, {encoding: 'UTF-8'})
                    );
                });

            expect(filesContent).to.have.length(2, 'Promises expect to read two files');
            expect(filesContent[0]).to.equal(filesContent[1], 'First file is not equal second');
        });

        it('sould correctly work with expire timestamps', () => {
            const cookieFile = 'tests/expire.cookie';
            const cookieExpire = 30 * 24 * 60 * 60;

            let cookieWithExpire = new Cookie({
                domain: ".google.com",
                name: "expireKey",
                value: "expireValue",
                expire: cookieExpire,
            });

            let cookieStorage = new CookieMap();
            cookieStorage.set(cookieWithExpire);

            cookieStorage.save(cookieFile);


            let cookieStorageTest = new CookieMap(cookieFile);
            expect(cookieStorageTest.size).to.equal(1);

            let {expire} = cookieStorageTest.get('expireKey');
            expect(expire).to.equal(cookieExpire);

        });

        it('should correctly write boolean values (https and crossdomain) in upper case', () => {
            const booleanCookie = new Cookie({
                    name: "booleanCookie",
                    value: "booleanValue",
                    domain: "google.com",
                    crossDomain: false,
                    https: true,
                }),
                cookieFile = 'tests/boolean.cookie',
                isHttps = true.toString().toUpperCase(),
                isCrossDomain = false.toString().toUpperCase(),
                cookieList = new CookieMap([booleanCookie]).save(cookieFile);

            const checkCookieList = new CookieMap(cookieFile);

            expect(checkCookieList.size).to.equal(1);
            const readCookie = checkCookieList.get('booleanCookie');
            expect(readCookie.isHttps).to.equal(isHttps);
            expect(readCookie.https).to.equal(true);
            expect(readCookie.isCrossDomain).to.equal(isCrossDomain);
            expect(readCookie.crossDomain).to.equal(false);
        });
        it('cloning cookies', () => {
            const properties = {
                name: "test",
                value: 123,
                https: false,
                expire: 0,
                httpOnly: false
            };
            let originalCookie = new Cookie(properties);

            let clone = originalCookie.clone();
            for (let property in properties) {
                expect(clone[property]).to.equal(originalCookie[property]);
            }

            const changes = {
                value: 345,
                httpOnly: true,
            };
            let save = {};
            for (let property in changes) {
                save[property] = clone[property];
                clone[property] = changes[property];
                expect(clone[property]).to.not.equal(originalCookie[property]);
            }
            for (let property in save) {
                clone[property] = save[property];
                expect(clone[property]).to.equal(originalCookie[property]);
            }

        });
        it('should correctly work with HttpOnly cookies', () => {
            const CookieFile = new CookieMap('tests/httponly.sample.cookie'),
                domain = "horatius.pro";

            expect(CookieFile).to.have.property("size").and.equal(2);

            let simpleCookie = CookieFile.get('simpleCookie');
            expect(simpleCookie).to.have.property('name').and.equal('simpleCookie');
            expect(simpleCookie).to.have.property('value').and.equal('simple');
            expect(simpleCookie).to.have.property('domain').and.equal(domain);
            expect(simpleCookie).to.have.property('httpOnly').and.equal(false, "Error on simple cookie detecting");

            let httpOnlyCookie = CookieFile.get('httpOnlyCookie');
            expect(httpOnlyCookie.name).to.equal('httpOnlyCookie');
            expect(httpOnlyCookie).to.have.property('httpOnly').and.equal(true, "Error on httpOnly Cookie detecting");
            expect(httpOnlyCookie).to.have.property('domain').and.equal(domain, "Error on detecting HttpOnly cookie domain");
        });
        it('sould corrently generate file with HttpOnly cookies', () => {
            const CookieFile = new CookieMap('tests/httponly.sample.cookie'),
                httpOnlyTestFile = 'tests/httponly.test.cookie';

            CookieFile.save(httpOnlyTestFile);


            const [sampleCookieFile, testCookieFile] = [httpOnlyTestFile, 'tests/httponly.sample.cookie']
                .map((file) => fs.readFileSync(file, {encoding: "UTF-8"}));

            expect(sampleCookieFile).to.equal(testCookieFile, "New test file must be equal to sample")
        });
        it('should correctly create and write HTTP headers', () => {
            const cookies = new CookieMap([
                new Cookie({name: 'test', value: 'testValue', expire: 0, domain: "horatius.pro"}),
                new Cookie({name: 'test2', value: 'defaultValue', httpOnly: true, domain: "google.com"}),
            ]);

            let cookieResponseHeader = cookies.toResponseHeader();

            expect(cookieResponseHeader).to.have.lengthOf(cookies.size);
            const cookiesParsed = new CookieMap();
            cookieResponseHeader.forEach((header) => cookiesParsed.header(header));

            expect(cookies).to.have.property("size").and.equal(2);

            const properties = ['name', 'value', 'expire', 'httpOnly'];

            for (let [name, cookie] of cookies) {
                let parsedCookie = cookiesParsed.get(name);
                expect(parsedCookie).to.be.an('object', `${name} cookie is not an object`);
                properties
                    .forEach(property => expect(cookie[property]).to.equal(
                        parsedCookie[property]), `${properties} is not same`
                    );
            }
        });
        it('should correctly generate request cookie header', () => {
            const data = [
                ["test", "value"],
                ["data", "sample"]
            ];
            const cookieMap = new CookieMap();
            data.forEach(([name, value]) => cookieMap.set(new Cookie({
                name, value, domain: "foo.bar"
            })));

            const requestCookieHeader = cookieMap.toRequestHeader();

            let cookies = requestCookieHeader
                .replace('Cookie: ', '').split('; ')
                .map(cookie => cookie.trim())
                .map(cookie => cookie.split('='));

            expect(cookies).to.have.lengthOf(data.length);

            for (let i = 0; i < data.length; i++) {
                let [name, value] = data[i];
                let [cookieName, cookieValue] = cookies[i];

                expect(name).to.equal(cookieName);
                expect(value).to.equal(cookieValue);
            }
        });

        after(() => {
            [
                'writeTest.cookie',
                'first.cookie',
                'second.cookie',
                'expire.cookie',
                'boolean.cookie',
                'httponly.test.cookie',
            ]
                .map((file) => `tests/${file}`)
                .filter(file => fileExists(file))
                .forEach((file) =>
                    fs.unlink(file, (error) => error && assert.fail(error))
                );
        });
    });
})
;