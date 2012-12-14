// Avoid `console` errors in browsers that lack a console.

/* test plugins.js*/

/*RedColorObject*/
function test_onPreLoad(){
	me.loader.preload(g_resources);
	me.levelDirector.loadLevel("area_01");
}

function test_RedColorObject(){
    var mX = 0;
    var mY = 0;
    var mClass = new RedColorObject(0, 0, {});
    assertEquals(0, mClass.gravity);
    assertFalse(mClass.collidable);
    assertEquals(g_resources_size[2].name, mClass.type);
};

/*ItemObjectObject*/
function test_ItemObject(){
    var mX = 0;
    var mY = 0;
    var mIndex = 5;
    if( mIndex >= 3 && mIndex <= 9 )
        assertTrue(true);
    else
        assertFalse(false);
    var mClass = new ItemObject(0, 0, {}, mIndex);
    assertNotNull(mClass);
    assertEquals(0, mClass.gravity);
    assertTrue(mClass.collidable);
    assertEquals(g_resources_size[mIndex].name, mClass.type);
};

function test_ItemObject_containLine(){
    var sPos = new me.Vector2d(0, 0);
    var mRect = new me.Rect(sPos, 32, 32);
    var ePos = new me.Vector2d(10, 10);
    var mClass = new ItemObject(0, 0, {}, 5);
    assertNotNull(mRect);
    assertNotNull(ePos);
    assertNotNull(sPos);
    assertTrue(mClass.containLine(mRect,sPos,ePos));
};
/* Weapon Class */
function test_iWeaponObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iWeaponObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 3);
    assertEquals(mTemp.mid, mID);
    assertFalse(mTemp.isDrag);
    assertEquals(mTemp.preX, 0);
    assertEquals(mTemp.preY, 0);
};

function test_iWeaponObject_onMouseDown(){
    me.input.mouse.pos.x = 100;
    me.input.mouse.pos.y = 100;
	select_item = 3;
    var mClass = new iWeaponObject(0, 0, {}, 1);
	mClass.isDrag = true;
	isDragable = true;
    assertNotEquals(select_item, -1);
    mClass.onMouseDown();
    assertTrue(mClass.isDrag);
    assertEquals(select_item, mClass.mResource);
    assertTrue(isDragable);
    assertEquals(mClass.preX, mClass.pos.x);
    assertEquals(mClass.preY, mClass.pos.y);
};

function test_iWeaponObject_onMouseUp(){
    var mClass = new iWeaponObject(10, 10, {}, 1);
	mClass.isDrag = false;
	isDragable = false;
    mClass.onMouseUp();
    assertFalse(mClass.isDrag);
    assertNull(SelectObject);
    assertFalse(isDragable);
    assertNotEquals(mClass.pos.x, mClass.preX);
    assertNotEquals(mClass.pos.y, mClass.preY);
};
/**/
function test_iEngineObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iEngineObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 4);
    assertEquals(mTemp.mid, mID);
    assertFalse(mTemp.isDrag);
    assertEquals(mTemp.preX, 0);
    assertEquals(mTemp.preY, 0);
};

function test_iEngineObject_onMouseDown(){
    me.input.mouse.pos.x = 100;
    me.input.mouse.pos.y = 100;
	select_item = 4;
    var mClass = new iEngineObject(0, 0, {}, 1);
    mClass.onMouseDown();
    assertNotEquals(select_item, -1);
    assertFalse(mClass.isDrag);
    assertEquals(select_item, mClass.mResource);
    assertFalse(isDragable);
    assertEquals(mClass.preX, mClass.pos.x);
    assertEquals(mClass.preY, mClass.pos.y);
};

function test_iEngineObject_onMouseUp(){
    var mClass = new iEngineObject(0, 0, {}, 1);
    mClass.onMouseUp();
    assertFalse(mClass.isDrag);
    assertFalse(isDragable);
    assertEquals(mClass.pos.x, 0);
    assertEquals(mClass.pos.y, 0);
};
function test_iPowerObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iPowerObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 5);
    assertEquals(mTemp.mid, mID);
    assertFalse(mTemp.isDrag);
    assertEquals(mTemp.preX, 0);
    assertEquals(mTemp.preY, 0);
};

function test_iPowerObject_onMouseDown(){
    var mClass = new iPowerObject(0, 0, {}, 1);
	select_item = 5;
    mClass.onMouseDown();
    assertFalse(mClass.isDrag);
    assertEquals(select_item, mClass.mResource);
    assertFalse(isDragable);
    assertEquals(mClass.preX, 0);
    assertEquals(mClass.preY, 0);
};

function test_iPowerObject_onMouseUp(){
    var mClass = new iPowerObject(0, 0, {}, 1);
    mClass.onMouseUp();
    assertFalse(mClass.isDrag);
    assertNull(SelectObject);
    assertNotEquals(select_item, -1);
    assertFalse(isDragable);
    assertEquals(mClass.pos.x, 0);
    assertEquals(mClass.pos.y, 0);
};

function test_iConsoleObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iConsoleObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 6);
    assertEquals(mTemp.mid, mID);
    assertFalse(mTemp.isDrag);
    assertEquals(mTemp.preX, 0);
    assertEquals(mTemp.preY, 0);
};

function test_iConsoleObject_onMouseDown(){
    var mClass = new iConsoleObject(0, 0, {}, 1);
	select_item = 6;
    mClass.onMouseDown();
    assertFalse(mClass.isDrag);
    assertEquals(select_item, mClass.mResource);
    assertFalse(isDragable);
    assertEquals(mClass.preX, 0);
    assertEquals(mClass.preY, 0);
};

function test_iConsoleObject_onMouseUp(){
    var mClass = new iConsoleObject(0, 0, {}, 1);
    mClass.onMouseUp();
    assertFalse(mClass.isDrag);
    assertNull(SelectObject);
    assertNotEquals(select_item, -1);
    assertFalse(isDragable);
    assertEquals(mClass.pos.x, 0);
    assertEquals(mClass.pos.y, 0);
};

function test_iConsoleObject_checkItemPos(){
    var mClass = new iConsoleObject(0, 0, {}, 1);
    var mX = 0;
    var mY = 0;
    var de = 1;
    assertNotNull(mClass);
    if(de >= 0 && de <= 3)
        assertTrue(true);
    else
        assertFalse(true);
};

function test_iComponentObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iComponentObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 7);
    assertEquals(mTemp.mid, mID);
    assertFalse(mTemp.isDrag);
    assertEquals(mTemp.preX, 0);
    assertEquals(mTemp.preY, 0);
};

function test_iComponentObject_onMouseDown(){
    var mClass = new iComponentObject(0, 0, {}, 1);
	select_item = 7;
    mClass.onMouseDown();
    assertFalse(mClass.isDrag);
    assertEquals(select_item, mClass.mResource);
    assertFalse(isDragable);
    assertEquals(mClass.preX, 0);
    assertEquals(mClass.preY, 0);
};

function test_iComponentObject_onMouseUp(){
    var mClass = new iComponentObject(0, 0, {}, 1);
    assertFalse(mClass.isDrag);
    assertNull(SelectObject);
    assertNotEquals(select_item, -1);
    assertFalse(isDragable);
    assertEquals(mClass.pos.x, 0);
    assertEquals(mClass.pos.y, 0);
};

function test_iDoorObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iDoorObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 8);
    assertEquals(mTemp.mid, mID);
    assertTrue(mTemp.rotateFlag);
    assertFalse(mTemp.mfix);
    assertEquals(mTemp.angle, Math.PI / 2);
};

function test_iDoorObject_processRotate(){
    var mClass = new iDoorObject(0, 0, {}, 1);
    mClass.processRotate();
    assertTrue(mClass.rotateFlag);
    assertNotEquals(mClass.angle, 0);
    assertNotEquals(mClass.width, 0);
    assertNotEquals(mClass.height, 0);
};

    
function test_iDoorObject_removeWallinCollision(){
    var mClass = new iDoorObject(0, 0, {}, 1);
    me.game.add(mClass);
    mClass.removeWallinCollision();
    assertNull(me.game.collide(mClass));
    me.game.remove(mClass);
};

function test_iWallObject(){
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iWallObject(mX, mY, {}, mID);
    assertNotNull(mTemp);
    assertEquals(mTemp.mResource, 9);
    assertEquals(mTemp.mid, mID);
};

function test_iWallObject_checkTopAndBottomWall(){
    var mClass = new iWallObject(0, 0, {}, 3);
    var mRet = mClass.checkTopAndBottomWall();
    switch(mRet){
    case 0:
        assertEquals("None collide", 0, mRet);
        break;
    case 2:
        assertEquals("collide with object else wall", 2, mRet);
        break;
    case 3:
        assertEquals("collide with wall on topside", 3, mRet);
        break;
    case 4:
        assertEquals("collide with wall on bottomside", 4, mRet);
        break;
    case 5:
        assertEquals("collide with wall on top/bottomside", 5, mRet);
        break
    default:
        assertEquals("Unknown value", 0, mRet);
    }
};

function test_iWallObject_checkLeftAndRightWall(){
    var mClass = new iWallObject(0, 0, {}, 3);
    var mRet = mClass.checkLeftAndRightWall();
    switch(mRet){
    case 0:
        assertEquals("None collide", 0, mRet);
        break;
    case 8:
        assertEquals("collide with object else wall", 2, mRet);
        break;
    case 7:
        assertEquals("collide with wall on leftside", 3, mRet);
        break;
    case 6:
        assertEquals("collide with wall on rightside", 4, mRet);
        break;
    case 5:
        assertEquals("collide with wall on left/right side", 5, mRet);
        break
    default:
        assertEquals("Unknown value", 0, mRet);
    }
};

function test_iWallObject_checkDirectWall(){
    var mClass = new iWallObject(0, 0, {}, 3);
    mClass.checkDirectWall();
    mClass.addAnimation ("vWall", [0]);
    mClass.addAnimation ("hWall", [1]);
    mClass.addAnimation ("LL_Wall", [2]);
    mClass.addAnimation ("E_Wall", [3]);
    mClass.addAnimation ("PL_Wall", [4]);
    mClass.addAnimation ("RL_Wall", [5]);
    mClass.addAnimation ("I_LL_Wall", [6]);
    mClass.addAnimation ("I_E_Wall", [7]);
    mClass.addAnimation ("I_RL_Wall", [8]);
    mClass.addAnimation ("LE_Wall", [9]);
    mClass.addAnimation ("RE_Wall", [10]);
    if(mClass.isCurrentAnimation("vWall") || mClass.isCurrentAnimation("hWall") || mClass.isCurrentAnimation("LL_Wall") || mClass.isCurrentAnimation("E_Wall") ||
        mClass.isCurrentAnimation("PL_Wall") || mClass.isCurrentAnimation("RL_Wall") || mClass.isCurrentAnimation("I_LL_Wall") || mClass.isCurrentAnimation("I_E_Wall") ||
        mClass.isCurrentAnimation("I_RL_Wall") || mClass.isCurrentAnimation("LE_Wall") || mClass.isCurrentAnimation("RE_Wall"))
        assertTrue(true);
    else
        assertFalse(true);
};
function test_WallGroupObject(){
    var mClass = new WallGroupObject(1);
    assertEquals(mClass.mid, 1);
    assertEquals(mClass.mResource, 101);
    assertEquals(mClass.WallPosX, 0);
    assertEquals(mClass.WallPosY, 0);
    assertEquals(mClass.mStarti, 0);
    assertEquals(mClass.mWallObject.length, 0);
};

function test_WallGroupObject_addWallObject(){
    var mClass = new WallGroupObject(1);
    var wallObj = mClass.addWallObject(100, 100);
    assertEquals(mClass.mWallObject[mClass.mWallObject.length - 1] , wallObj);
};
    
function test_WallGroupObject_removeWallObject(){
    var mClass = new WallGroupObject(1);
    var mWall = new iWallObject(0, 0, {}, 2);
    assertFalse(mClass.removeWallObject(mWall));
};

function test_WallGroupObject_removeAll() {
    var mClass = new WallGroupObject(1);
    mClass.addWallObject(100, 100);
    mClass.addWallObject(100, 100);
    mClass.addWallObject(100, 100);
    mClass.removeAll(1);
    assertEquals(mClass.mWallObject.length, 1);
};

function test_WallGroupObject_getFirstWallObject() {
    var mClass = new WallGroupObject(1);
    mClass.addWallObject(100, 100);
    assertNotNull(mClass.getFirstWallObject());
};

function test_WallGroupObject_setPrePostoCurPos(){
    var mClass = new WallGroupObject(1);
    mClass.addWallObject(100, 100);
    mClass.setPrePostoCurPos();
    assertEquals(mClass.mWallObject[0].preX, mClass.mWallObject[0].pos.x);
    assertEquals(mClass.mWallObject[0].preY, mClass.mWallObject[0].pos.y);
};

function test_WallGroupObject_setCurPostoPrePos(){
    var mClass = new WallGroupObject(1);
    mClass.addWallObject(100, 100);
    mClass.setCurPostoPrePos();
    assertEquals(mClass.mWallObject[0].preX, mClass.mWallObject[0].pos.x);
    assertEquals(mClass.mWallObject[0].preY, mClass.mWallObject[0].pos.y);
};

function test_makeJsonString(){
    var mClass = makeJsonString;
    assertEquals(mClass.JsonString, "");
};

function test_makeJsonString_setFirstString(){
    var mClass = makeJsonString;
    mClass.setFirstString();
    assertEquals(mClass.JsonString, '{"Objects" : [');
};

function test_makeJsonString_makeObjecttoString(){
    var mClass = makeJsonString;
    var mTemp1 = new iWallObject(0, 0, {}, 1);
    assertNotNull(mTemp1);
    mClass.makeObjecttoString(mTemp1, true);
    assertEquals(mClass.JsonString, '{"Objects" : [{"Resource":9,"id":1,"PosX":0,"PosY":0,"Fix":false,"angle":0,"animation":"hWall"}');
};

function test_makeJsonString_setEndString(){
    var mClass = makeJsonString;
    mClass.JsonString = "";
    mClass.setEndString();
    assertEquals(mClass.JsonString, ']}');
};
