/*
-*- coding: utf-8 -*-
 vim: set ts=4 sw=4 et sts=4 ai:
 */
onLevelReady(function () {
    module("main.js");

    test("Globals are set", function () {
        ok(TILE_SIZE, "TILE_SIZE");
        ok(WIDTH, "WIDTH");
        ok(HEIGHT, "HEIGHT");
        ok(ship, "ship");
        ok(ui, "ui");
    });

    module("main.js/ship");

    shipTest("buildAt", function () {
        ok(ship.buildAt(testShipPositions.free.x, testShipPositions.free.y, "power"), "could build power");
        equal(ship.buildings[0].type, "power", "first building is power");
    });

    shipTest("engine proper placement", function () {
        ok(ship.buildAt(testShipPositions.engine.x, testShipPositions.engine.y, "engine"), "building succeeds");
    });

    shipTest("engine invalid placement", function () {
        ok(!ship.buildAt(testShipPositions.free.x, testShipPositions.free.y, "engine"), "building fails");
    });

    shipTest("weapon proper placement", function () {
        ok(ship.buildAt(testShipPositions.weapon.x, testShipPositions.weapon.y, "weapon"), "building succeeds");
    });

    shipTest("weapon invalid placement", function () {
        ok(!ship.buildAt(testShipPositions.free.x, testShipPositions.free.y, "weapon"), "building fails");
    });

    shipTest("add/mapAt/removeAt", function () {
        var x = testShipPositions.free.x;
        var y = testShipPositions.free.y;
        var engine = new iEngineObject(x, y);
        //(ignores placement rules)
        ship.add(engine);
        equal(ship.buildings[0].type, "engine", "First building is engine after adding");

        //mapAt
        equal(ship.mapAt(x, y).type, "engine", "mapAt(x, y) is engine");
        equal(ship.mapAt(x + 1, y).type, "engine", "mapAt(x + 1, y) is engine");
        equal(ship.mapAt(x, y + 1).type, "engine", "mapAt(x, y + 1) is engine");
        equal(ship.mapAt(x + 1, y + 1).type, "engine", "mapAt(x + 1, y + 1) is engine");
        notEqual(ship.mapAt(x + 2, y + 1).type, "engine", "mapAt(x + 2, y + 1) is not engine");
        notEqual(ship.mapAt(x, y - 1).type, "engine", "mapAt(x, y - 1) is not engine");

        //removeAt
        ship.removeAt(x + 1, y); //random engine tile
        equal(ship.buildings.length, 0, "Ship has 0 buildings after removing");
        notEqual(ship.mapAt(x, y), "engine", "mapAt(x, y) no longer engine");
        notEqual(ship.mapAt(x, y + 1), "engine", "mapAt(x, y + 1) no longer engine");
        notEqual(ship.mapAt(x + 1, y), "engine", "mapAt(x+1, y) no longer engine");
        notEqual(ship.mapAt(x + 1, y + 1), "engine", "mapAt(x+1, y + 1) no longer engine");
    });

    shipTest("remove", function () {
        var x = testShipPositions.free.x;
        var y = testShipPositions.free.y;
        ship.buildAt(x, y, "component");
        equal(ship.buildings[0].type, "component", "Ship has component built");
        equal(ship.mapAt(x, y).type, "component", "mapAt(x,y) is component");
        var item = ship.buildings[0];
        ship.remove(item);
        notEqual(ship.mapAt(x, y).type, "component", "mapAt(x,y) is no longer component after removing");
        equal(ship.buildings.length, 0, "ship has no buildings");
    });

    shipTest("buildAt rotates item when it can only be built rotated", function () {
        var x = testShipPositions.free.x;
        var y = testShipPositions.free.y;
        var door = new iDoorObject();
        ok(!door.canBuildAt(x, y), "Cannot build at x,y (there's no wall)");
        ok(!door.canBuildRotated(x, y), "It cannot be built rotated either");

        ship.buildAt(x, y, "wall");
        ship.buildAt(x, y + 1, "wall");
        me.game.update(); //update wall animations, important for door placement rules
        ok(!door.canBuildAt(x, y), "After building vertical wall, door still cannot be built at x,y...");
        ok(door.canBuildRotated(x, y), "... but it can rotated.");

        ship.buildAt(x, y, "door");
        equal(ship.mapAt(x, y + 1).type, "door", "mapAt(x, y+1) is door (it should be rotated, that is, vertical)");
        notEqual(ship.mapAt(x + 1, y).type, "door", "mapAt(x+1,y) is not door");
        ok(ship.mapAt(x, y + 1).rotated(), "Door has 'rotated' status");
    });

    shipTest("mapAt out of bounds", function () {
        strictEqual(ship.mapAt(-1, 0), null, "mapAt(-1,0) is null");
        strictEqual(ship.mapAt(WIDTH, 0), null, "mapAt(WIDTH,0) is null");
        strictEqual(ship.mapAt(0, HEIGHT), null, "mapAt(0,HEIGHT) is null");
    });

    shipTest("fromJsonString", function () {
        ship.fromJsonString('[{"type":"power", "x":0, "y":0}, {"type":"door", "x":2, "y":3, "rotated":true}]');

        var power = ship.mapAt(0, 0);
        equal(power.type, "power", "power successfully added to the ship");
        equal(power.x(), 0, "it has correct x position");
        equal(power.y(), 0, "it has correct y position");
        ok(!power.rotated(), "power is not rotated");

        var door = ship.mapAt(2, 3);
        equal(door.type, "door", "door successfully added to the ship");
        equal(door.x(), 2, "it has correct x position");
        equal(door.y(), 3, "it has correct y position");
        ok(door.rotated(), "door is rotated");

        equal(ship.buildings.length, 2, "ship has 2 buildings added");
    });

    shipTest("fromJsonString clears buildings", function () {
        ok(ship.buildAt(testShipPositions.free.x, testShipPositions.free.y, "power"), "power successfully built");
        ok(ship.buildAt(testShipPositions.engine.x, testShipPositions.engine.y, "engine"), "engine succesfully built");
        ship.fromJsonString('[{"type":"wall", "x":0, "y":0}]');
        equal(ship.buildings.length, 1, "ship has only one building after loading");
        equal(ship.buildings[0].type, "wall", "that only building is a wall (loaded through json)");

        ship.fromJsonString('[]');
        equal(ship.buildings.length, 0, "ship has 0 buildings after loading empty array");
    });

    shipTest("toJsonString", function () {
        ok(ship.buildAt(testShipPositions.free.x, testShipPositions.free.y, "power"), "power successfully built");
        ok(ship.buildAt(testShipPositions.engine.x, testShipPositions.engine.y, "engine"), "engine succesfully built");
        ship.mapAt(testShipPositions.engine.x, testShipPositions.engine.y).rotated(true);

        var jsonObject = JSON.parse(ship.toJsonString());
        equal(jsonObject.length, 2, "JSON object (array) has 2 objects");

        var power = _.find(jsonObject, function (i) { return i.type == "power"; });
        equal(power.x, testShipPositions.free.x, "power saved with correct x position");
        equal(power.y, testShipPositions.free.y, "power saved with correct y position");
        ok(!power.rotated, "power saved as not rotated");

        var engine = _.find(jsonObject, function (i) { return i.type == "engine"; });
        equal(engine.x, testShipPositions.engine.x, "engine saved with correct x position");
        equal(engine.y, testShipPositions.engine.y, "engine saved with correct y position");
        ok(engine.rotated, "engine saved as rotated");
    });
});