module("placement-rules.js");

test("Empty PlacementRule always complies", function () {
    var tileMap = ["112o", "o#oo", "3o3o"];

    var rule0 = new pr.PlacementRule({});
    ok(rule0.compliesAt(1, 1, tileMap));
});

test("pr.PlacementRule", function () {
    var tileMap = ["112o", "o#oo", "3o3o"];
    var current = { x: 1, y: 1 };

    var rule1 = new pr.PlacementRule({ tile: "2", inAny: [{ x: 123, y: 234 }, { x: 1, y: -1}] });
    ok(rule1.compliesAt(current.x, current.y, tileMap));
});

test("pr.make.spaceRule", function () {
    var tileMap = ["112o", "o#oo", "3o3o"];
    
    var spaceRule = pr.make.spaceRule("o", 1, 3);
    equal(spaceRule.compliesAt(3, 0, tileMap), true);
    spaceRule = pr.make.spaceRule("o", 2, 3);
    equal(spaceRule.compliesAt(3, 0, tileMap), false);
    spaceRule = pr.make.spaceRule("o", 1, 4);
    equal(spaceRule.compliesAt(3, 0, tileMap), false);
});

test("pr.spots.getAllowedSpots", function () {
    var tileMap = ["112o", "o#oo", "3o3o"];

    var closeToA3Rule = new pr.PlacementRule({ tile: "3",
        inAny: [{ x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
                { x: -1, y: 0 },                    { x: 1, y: 0 },
                { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1}]
    });
    ok(closeToA3Rule.compliesAt(1, 1, tileMap)); //includes diagonals

    var inAnORule = new pr.PlacementRule({ tile: "o", inAll: [{ x: 0, y: 0}] });
    ok(inAnORule.compliesAt(3, 0, tileMap)); //top right corner

    var allowedSpots = pr.spots.getAllowedSpots(tileMap, [closeToA3Rule, inAnORule], [2, 2], [0, 0]);
    var n = pr.spots.forbidden;
    var y = pr.spots.allowed;
    var z = pr.spots.allowedZone;
    deepEqual(allowedSpots, [[n, n, n, n],
                             [y, z, y, y],
                             [z, y, z, y]]);

});

test("pr.utils.checkIsInAny", function () {
    var tileMap = ["112o", "o#oo", "3o3o"];
    var current = { x: 1, y: 1 };

    equal(pr.utils.checkIsInAny(tileMap, "2", [{ x: 123, y: 234 }, { x: 1, y: -1}], current), true);
    equal(pr.utils.checkIsInAny(tileMap, "2", [{ x: 1, y: 0}], current), false);
    equal(pr.utils.checkIsInAny(tileMap, "2", [], current), true);
});

test("pr.utils.checkIsInAll", function () {
    var tileMap = ["112o", "o#oo", "3o3o"];
    var current = { x: 1, y: 1 };

    equal(pr.utils.checkIsInAll(tileMap, "3", [{ x: 1, y: 1 }, { x: -1, y: 1}], current), true);
    equal(pr.utils.checkIsInAll(tileMap, "3", [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: 123, y: 13}], current), false);
    equal(pr.utils.checkIsInAll(tileMap, "3", [], current), true);
});

test("pr.utils.getZeroMatrix", function () {
    var matrix = pr.utils.getZeroMatrix(2, 3);
    equal(matrix[0][0], 0);
    equal(matrix[0][1], 0);
    equal(matrix[1][0], 0);
    equal(matrix[1][1], 0);
    equal(matrix[2][0], 0);
    equal(matrix[2][1], 0);
    equal(matrix[0][2], undefined);
    equal(matrix[3], undefined);

});