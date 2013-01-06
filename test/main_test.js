/*
-*- coding: utf-8 -*-
 vim: set ts=4 sw=4 et sts=4 ai:
 */
onLevelReady(function(){
	module("main.js");

	test("Globals are set", function() {
		ok(TILE_SIZE, "TILE_SIZE");
		ok(WIDTH, "WIDTH");
		ok(HEIGHT, "HEIGHT");
		ok(ship, "ship");
		ok(ui, "ui");
	});

	module("main.js/ship");
	
	shipTest("buildAt", function(){
		ok(ship.buildAt(testShipPositions.free.x, testShipPositions.free.y, "power"), "could build power");
		equal(ship.buildings[0].type, "power", "first building is power");
	});

	shipTest("engine proper placement", function(){
		ok(ship.buildAt(testShipPositions.engine.x, testShipPositions.engine.y, "engine"), "could build component");	
	});

	shipTest("engine invalid placement", function(){
		ok(!ship.buildAt(testShipPositions.free.x, testShipPositions.free.y, "engine"), "building fails");	
	});

	shipTest("weapon proper placement", function(){
		ok(ship.buildAt(testShipPositions.weapon.x, testShipPositions.weapon.y, "weapon"), "could build weapon");	
	});

	shipTest("weapon invalid placement", function(){
		ok(!ship.buildAt(testShipPositions.free.x, testShipPositions.free.y, "weapon"), "building fails");	
	});
});