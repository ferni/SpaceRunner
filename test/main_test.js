/*
-*- coding: utf-8 -*-
 vim: set ts=4 sw=4 et sts=4 ai:
 */

module("main.js");

loadedTest("Globals are set", function() {
	ok(TILE_SIZE, "TILE_SIZE");
	ok(WIDTH, "WIDTH");
	ok(HEIGHT, "HEIGHT");
	ok(ship, "ship");
	ok(ui, "ui");
});

module("main.js/ship");
