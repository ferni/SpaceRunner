/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
pr, _, me, utils, sh*/

module('placement-rules.js');

test('Empty PlacementRule always complies', function() {
    'use strict';
    var tileMap, rule0;
    tileMap = new sh.Map(['112o', 'o#oo', '3o3o']);
    rule0 = new sh.pr.PlacementRule({});
    ok(rule0.compliesAt(1, 1, tileMap));
});

test('sh.pr.PlacementRule', function() {
    'use strict';
    var tileMap, current, rule1;
    tileMap = new sh.Map(['112o', 'o#oo', '3o3o']);
    current = {
        x: 1,
        y: 1
    };

    rule1 = new sh.pr.PlacementRule({
        tile: '2',
        inAny: [{
            x: 123,
            y: 234
        }, {
            x: 1,
            y: -1
        }]
    });
    ok(rule1.compliesAt(current.x, current.y, tileMap));
});

test('sh.pr.make.spaceRule', function() {
    'use strict';
    var tileMap, spaceRule;
    tileMap = new sh.Map(['112o', 'o#oo', '3o3o']);

    spaceRule = sh.pr.make.spaceRule('o', 1, 3);
    equal(spaceRule.compliesAt(3, 0, tileMap), true);
    spaceRule = sh.pr.make.spaceRule('o', 2, 3);
    equal(spaceRule.compliesAt(3, 0, tileMap), false);
    spaceRule = sh.pr.make.spaceRule('o', 1, 4);
    equal(spaceRule.compliesAt(3, 0, tileMap), false);
});

test('sh.pr.make.nextToRule', function() {
    'use strict';
    var tileMap, nextToRule;
    tileMap = new sh.Map(['112o', 'o#oo', '3o3o']);
    nextToRule = sh.pr.make.nextToRule('3', 1, 2);
    ok(_.some(nextToRule.inAny, function(c) { //left
        return c.x === -1 && c.y === 0;
    }));
    ok(_.some(nextToRule.inAny, function(c) {
        return c.x === -1 && c.y === 1;
    }));
    ok(_.some(nextToRule.inAny, function(c) { //bottom
        return c.x === 0 && c.y === 2;
    }));
    ok(_.some(nextToRule.inAny, function(c) { //top
        return c.x === 0 && c.y === -1;
    }));
    ok(_.some(nextToRule.inAny, function(c) { //right
        return c.x === 1 && c.y === 0;
    }));
    ok(_.some(nextToRule.inAny, function(c) {
        return c.x === 1 && c.y === 1;
    }));
    equal(nextToRule.compliesAt(3, 0, tileMap), false);
    equal(nextToRule.compliesAt(3, 1, tileMap), true);
});

test('sh.pr.utils.checkAny', function() {
    'use strict';
    var tileMap, current, condition;
    tileMap = new sh.Map(['112o', 'o#oo', '3o3o']);
    current = {
        x: 1,
        y: 1
    };

    condition = function(t) {
        return t === '2';
    };

    equal(sh.pr.utils.checkAny(tileMap, condition, [{
        x: 123,
        y: 234
    }, {
        x: 1,
        y: -1
    }], current), true);
    equal(sh.pr.utils.checkAny(tileMap, condition, [{
        x: 1,
        y: 0
    }], current), false);
    equal(sh.pr.utils.checkAny(tileMap, condition, [], current), true);
});

test('sh.pr.utils.checkAll', function() {
    'use strict';
    var tileMap, current, condition;
    tileMap = new sh.Map(['112o', 'o#oo', '3o3o']);
    current = {
        x: 1,
        y: 1
    };

    condition = function(t) {
        return t === '3';
    };

    equal(sh.pr.utils.checkAll(tileMap, condition, [{
        x: 1,
        y: 1
    }, {
        x: -1,
        y: 1
    }], current), true);
    equal(sh.pr.utils.checkAll(tileMap, condition, [{
        x: 1,
        y: 1
    }, {
        x: -1,
        y: 1
    }, {
        x: 123,
        y: 13
    }], current), false);
    equal(sh.pr.utils.checkAll(tileMap, condition, [], current), true);
});

