/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global test, sh, strictEqual*/

test('Jsonable conserving numbers types', function() {
    'use strict';
    var Person = sh.Jsonable.extendShared({
        init: function(json) {
            this.set('Person', ['name', 'age', 'height'], json);
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
});
