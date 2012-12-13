/*
-*- coding: utf-8 -*-
 vim: set ts=4 sw=4 et sts=4 ai:
 */

// test main.js
function test_checkCollision(){
    var mClass = checkCollision;
    assertNotNull(mClass.RedScreen);
    assertEquals(mClass.TileWidth, 0);
    assertEquals(mClass.TileHeight, 0);
};

function test_checkCollision_printRedStyle(){
    var mClass = checkCollision;
    var preValue = mClass.RedIndex;
    mClass.printRedStyle(0, 0);
    assertNotEquals(mClass.RedIndex, preValue);
};

function test_checkCollision_removeRedStyle(){
    var mClass = checkCollision;
    mClass.removeRedStyle();
    assertEquals(mClass.RedIndex, 0);
};

function test_checkCollision_checkObjectCollision(){
    var Obj1 = new iWeaponObject(0, 0, {}, 1);
    me.game.add(Obj1);
    var Obj2 = new iWeaponObject(0, 0, {}, 2);
    me.game.add(Obj2);
    var mClass = checkCollision;
    assertFalse(mClass.checkObjectCollision(Obj2));
    assertEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
    me.game.remove(Obj2);
};

function test_checkCollision_checkOutlineCollisionWithWeapon(){
    var Obj1 = new iWeaponObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = checkCollision;
    assertTrue(mClass.checkOutlineCollisionWithWeapon(Obj1));
    assertEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_checkOutlineCollisionWithEngine(){
    var Obj1 = new iEngineObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = checkCollision;
    assertTrue(mClass.checkOutlineCollisionWithEngine(Obj1));
    assertEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_checkOutlineCollisionWithPower(){
    var Obj1 = new iPowerObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = checkCollision;
    assertTrue(mClass.checkOutlineCollisionWithPower(Obj1));
    assertEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_checkOutlineCollision(){
    var Obj1 = new iWeaponObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = checkCollision;
    assertTrue(mClass.checkOutlineCollision(Obj1));
    assertEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

/* Screen Object */
function test_PlayScreen(){
    var mClass = new PlayScreen;
    assertEquals(mClass.iItemID, 0);
    assertNotNull(checkCollision.RedScreen);
    assertEquals(checkCollision.TileWidth, 0);
    assertEquals(checkCollision.TileHeight, 0);
};
