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
            const cookieExpire = Date.now() + 30 * 24 * 60 * 60;

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

        after(() => {
            ['writeTest.cookie', 'first.cookie', 'second.cookie', 'expire.cookie']
                .map((file) => `tests/${file}`)
                .forEach((file) =>
                    fileExists(file)
                    &&
                    fs.unlink(file, (error) => error && assert.fail(error))
                );
        });
    });
})
;