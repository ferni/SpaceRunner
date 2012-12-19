/*
-*- coding: utf-8 -*-
 vim: set ts=4 sw=4 et sts=4 ai:
 */

module("main.js");

// test main.js
test("checkCollision", function() {
    var mClass = checkCollision;
    notStrictEqual(mClass.RedScreen, null);
    equal(mClass.TileWidth, 0);
    equal(mClass.TileHeight, 0);
});

test("checkCollision_printRedStyle", function() {
    var mClass = checkCollision;
    var preValue = mClass.RedIndex;
    mClass.printRedStyle(0, 0);
    notEqual(mClass.RedIndex, preValue);
});

test("checkCollision_removeRedStyle", function() {
    var mClass = checkCollision;
    mClass.removeRedStyle();
    equal(mClass.RedIndex, 0);
});

/*
//Change: This test should no longer use checkCollision object
//checkObjectCollision is in ItemObject
test("checkCollision_checkObjectCollision", function() {
    var Obj1 = new iWeaponObject(0, 0, {}, 1);
    me.game.add(Obj1);
    var Obj2 = new iWeaponObject(0, 0, {}, 2);
    me.game.add(Obj2);
    var mClass = checkCollision;
    strictEqual(mClass.checkObjectCollision(Obj2), false);
    equal(mClass.RedIndex, 0);
    me.game.remove(Obj1);
    me.game.remove(Obj2);
});

//Change: checkOutlineCollision moved to ItemObject
test("checkCollision_checkOutlineCollision", function() {
    var Obj1 = new iWeaponObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = checkCollision;
    ok(mClass.checkOutlineCollision(Obj1));
    equal(mClass.RedIndex, 0);
    me.game.remove(Obj1);
});
*/

/* Screen Object */
test("PlayScreen", function() {
    var mClass = new PlayScreen;
    equal(mClass.iItemID, 0);
    notStrictEqual(checkCollision.RedScreen, null);
    equal(checkCollision.TileWidth, 0);
    equal(checkCollision.TileHeight, 0);
});
