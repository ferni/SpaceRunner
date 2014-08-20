/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global test, sh, strictEqual, equal*/

test('Jsonable conserving numbers types', function() {
    'use strict';
    var Person = sh.Jsonable.extendShared({
        init: function(json) {
            this.configJson({
                type: 'Person',
                transfer: ['name', 'age', 'height'],
                json: json
            });
        }
    }),
        john = new Person({
            name: 'John',
            age: 32,
            height: 180
        }),
        johnJson = john.toJson();
    johnJson.age = '21';
    john = new Person(johnJson);
    strictEqual(john.age, 21);
    john = new Person(john.toJson());
    strictEqual(john.age, 21);
});

test('sh.v.distance', function() {
    'use strict';
    equal(sh.v.distance({x: -1, y: 1}, {x: 2, y: -3}), 5);
});
