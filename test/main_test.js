/*
-*- coding: utf-8 -*-
 vim: set ts=4 sw=4 et sts=4 ai:
 */

// test main.js
function test_checkCollision(){
    var mClass = new checkCollision;
    assertNull(mClass.RedScreen);
    assertEquals(mClass.RedScreen, 0);
    assertEquals(mClass.TileWidth, me.game.currentLevel.tilewidth);
    assertEquals(mClass.TileHeight, me.game.currentLevel.tileheight);
};

function test_checkCollision_getCollisionTileStyle(){
    var mX = 0;
    var mY = 0;
    var mClass = new checkCollision;
    var mRet = mClass.getCollisionTileStyle(mX, mY);
    switch(mRet){
        case 0:
            assertTrue("none style", true);
            break;
        case 1:
            assertTrue("plateform style", true);
            break;
        case 2:
            assertTrue("solid style", true);
            break;
        case 3:
            assertTrue("leftslope style", true);
            break;
        case 4:
            assertTrue("rightslope style", true);
            break;
        default:
            assertFalse(true);
            break;
    }
};

function test_checkCollision_printRedStyle(){
    var mClass = new checkCollision;
    var preValue = mClass.RedIndex;
    mClass.printRedStyle(0, 0);
    assertNotEquals(mClass.RedIndex, preValue);
};

function test_checkCollision_removeRedStyle(){
    var mClass = new checkCollision;
    mClass.removeRedStyle();
    assertEquals(mClass.RedIndex, 0);
};

function test_checkCollision_checkObjectCollision(){
    var Obj1 = new iWeaponObject(0, 0, {}, 1);
    me.game.add(Obj1);
    var Obj2 = new iWeaponObject(0, 0, {}, 2);
    me.game.add(Obj2);
    var mClass = new checkCollision;
    assertFalse(mClass.checkObjectCollision(Obj2));
    assertNotEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
    me.game.remove(Obj2);
};

function test_checkCollision_checkOutlineCollisionWithWeapon(){
    var Obj1 = new iWeaponObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = new checkCollision;
    assertFalse(mClass.checkOutlineCollisionWithWeapon(Obj1));
    assertNotEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_checkOutlineCollisionWithEngine(){
    var Obj1 = new iEngineObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = new checkCollision;
    assertFalse(mClass.checkOutlineCollisionWithEngine(Obj1));
    assertNotEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_checkOutlineCollisionWithPower(){
    var Obj1 = new iPowerObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = new checkCollision;
    assertFalse(mClass.checkOutlineCollisionWithPower(Obj1));
    assertNotEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_checkOutlineCollisionWithConsole(){
    var Obj1 = new iConsoleObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = new checkCollision;
    assertFalse(mClass.checkOutlineCollisionWithConsole(Obj1));
    assertNotEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_checkOutlineCollisionWithComponent(){
    var Obj1 = new iComponentObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = new checkCollision;
    assertFalse(mClass.checkOutlineCollisionWithComponent(Obj1));
    assertNotEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_checkOutlineCollisionWithDoor(){
    var Obj1 = new iDoorObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = new checkCollision;
    assertFalse(mClass.checkOutlineCollisionWithDoor(Obj1));
    assertNotEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_checkOutlineCollisionWithWall(){
    var Obj1 = new iWallObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = new checkCollision;
    assertFalse(mClass.checkOutlineCollisionWithWall(Obj1));
    assertNotEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_checkOutlineCollision(){
    var Obj1 = new iWallObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = new checkCollision;
    assertFalse(mClass.checkOutlineCollision(Obj1));
    assertNotEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};

function test_checkCollision_processCollision(){
    var Obj1 = new iWallObject(0, 0, {}, 2);
    me.game.add(Obj1)
    var mClass = new checkCollision;
    assertFalse(mClass.processCollision(Obj1));
    assertNotEquals(mClass.RedIndex, 0);
    me.game.remove(Obj1);
};


/* Screen Object */
function test_PlayScreen(){
    var mClass = new PlayScreen;
    assertEquals(mClass.iItemID, 0);
    assertNull(checkCollision.RedScreen);
    assertEquals(checkCollision.RedScreen, 0);
    assertEquals(checkCollision.TileWidth, me.game.currentLevel.tilewidth);
    assertEquals(checkCollision.TileHeight, me.game.currentLevel.tileheight);
};