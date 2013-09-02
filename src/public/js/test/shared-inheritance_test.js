/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, test, sh, equal, throws*/

module('shared-inheritance');

test('Basic stuff', function() {
    'use strict';
    var Parent, Child, parent, child;
    Parent = sh.TestSharedEntity.extendShared({
        init: function(id) {
            this.id = id;
        },
        toString: function() {
            return 'I am the ' + this.getDescription() +
                ' with id ' + this.id;
        },
        getDescription: function() {
            return 'parent';
        }
    });
    parent = new Parent(133);
    equal(parent.id, 133, 'parent.id set');
    equal(parent.getDescription(), 'parent', 'parent.getDescription works');
    equal(parent.toString(), 'I am the parent with id 133',
        'parent.toString returns proper value');

    Child = Parent.extendShared({
        init: function(id, number) {
            this.parent(id);
            this.number = number;
        },
        toString: function() {
            return this.parent() +
                ' (#' + this.number + ')';
        },
        getDescription: function() {
            return 'child';
        }
    });
    child = new Child(144, 1);
    equal(child.id, 144, 'child.id set');
    equal(child.getDescription(), 'child', 'child.getDescription works');
    equal(child.toString(), 'I am the child with id 144 (#1)',
        'child.toString returns proper value');

});


test('Invalid usage of extend instead of extendShared', function() {
    'use strict';
    var Person = sh.TestSharedEntity.extendShared({
        init: function(name) {
            this.name = name;
        }
    });
    throws(function() {
        Person.extend({});
    }, Error, 'throws error');
});

