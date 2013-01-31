module('placement-rules.js');

test('Empty PlacementRule always complies', function() {
    var tileMap = ['112o', 'o#oo', '3o3o'];

    var rule0 = new pr.PlacementRule({});
    ok(rule0.compliesAt(1, 1, tileMap));
});

test('pr.PlacementRule', function() {
    var tileMap = ['112o', 'o#oo', '3o3o'];
    var current = {
        x: 1,
        y: 1
    };

    var rule1 = new pr.PlacementRule({
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

test('pr.make.spaceRule', function() {
    var tileMap = ['112o', 'o#oo', '3o3o'];

    var spaceRule = pr.make.spaceRule('o', 1, 3);
    equal(spaceRule.compliesAt(3, 0, tileMap), true);
    spaceRule = pr.make.spaceRule('o', 2, 3);
    equal(spaceRule.compliesAt(3, 0, tileMap), false);
    spaceRule = pr.make.spaceRule('o', 1, 4);
    equal(spaceRule.compliesAt(3, 0, tileMap), false);
});

test('pr.make.nextToRule', function() {
    var tileMap = ['112o', 'o#oo', '3o3o'];

    var nextToRule = pr.make.nextToRule('3', 1, 2);
    ok(_.some(nextToRule.inAny, function(c) { //left
        return c.x == -1 && c.y == 0;
    }));
    ok(_.some(nextToRule.inAny, function(c) {
        return c.x == -1 && c.y == 1;
    }));
    ok(_.some(nextToRule.inAny, function(c) { //bottom
        return c.x == 0 && c.y == 2;
    }));
    ok(_.some(nextToRule.inAny, function(c) { //top
        return c.x == 0 && c.y == -1;
    }));
    ok(_.some(nextToRule.inAny, function(c) { //right
        return c.x == 1 && c.y == 0;
    }));
    ok(_.some(nextToRule.inAny, function(c) {
        return c.x == 1 && c.y == 1;
    }));
    equal(nextToRule.compliesAt(3, 0, tileMap), false);
    equal(nextToRule.compliesAt(3, 1, tileMap), true);
});

test('pr.utils.checkAny', function() {
    var tileMap = ['112o', 'o#oo', '3o3o'];
    var current = {
        x: 1,
        y: 1
    };

    var condition = function(t) {
        return t == '2';
    };

    equal(pr.utils.checkAny(tileMap, condition, [{
        x: 123,
        y: 234
    }, {
        x: 1,
        y: -1
    }], current), true);
    equal(pr.utils.checkAny(tileMap, condition, [{
        x: 1,
        y: 0
    }], current), false);
    equal(pr.utils.checkAny(tileMap, condition, [], current), true);
});

test('pr.utils.checkAll', function() {
    var tileMap = ['112o', 'o#oo', '3o3o'];
    var current = {
        x: 1,
        y: 1
    };

    var condition = function(t) {
        return t == '3';
    };

    equal(pr.utils.checkAll(tileMap, condition, [{
        x: 1,
        y: 1
    }, {
        x: -1,
        y: 1
    }], current), true);
    equal(pr.utils.checkAll(tileMap, condition, [{
        x: 1,
        y: 1
    }, {
        x: -1,
        y: 1
    }, {
        x: 123,
        y: 13
    }], current), false);
    equal(pr.utils.checkAll(tileMap, condition, [], current), true);
});