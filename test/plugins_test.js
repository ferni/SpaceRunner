// Avoid `console` errors in browsers that lack a console.

/* test plugins.js*/
module("plugins.js");
/*RedColorObject*/
test("onPreLoad", function() {
    me.loader.preload(g_resources);
    me.levelDirector.loadLevel("area_01");
});

test("RedColorObject", function() {
    var mX = 0;
    var mY = 0;
    var mClass = new RedColorObject(0, 0, {});
    equal(0, mClass.gravity);
    strictEqual(mClass.collidable, false);
    equal(g_resources_size[2].name, mClass.type);
});

/*ItemObjectObject*/
test("ItemObject", function() {
    var mX = 0;
    var mY = 0;
    var mIndex = 5;
    if( mIndex >= 3 && mIndex <= 9 )
        ok(true);
    else
        strictEqual(false, false);
    var mClass = new ItemObject(0, 0, {}, mIndex);
    notStrictEqual(mClass, null);
    equal(0, mClass.gravity);
    ok(mClass.collidable);
    equal(g_resources_size[mIndex].name, mClass.type);
});

test("ItemObject_containLine", function() {
    var sPos = new me.Vector2d(0, 0);
    var mRect = new me.Rect(sPos, 32, 32);
    var ePos = new me.Vector2d(10, 10);
    var mClass = new ItemObject(0, 0, {}, 5);
    notStrictEqual(mRect, null);
    notStrictEqual(ePos, null);
    notStrictEqual(sPos, null);
    ok(mClass.containLine(mRect,sPos,ePos));
});
/* Weapon Class */
test("iWeaponObject", function() {
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iWeaponObject(mX, mY, {}, mID);
    notStrictEqual(mTemp, null);
    equal(mTemp.mResource, 3);
    equal(mTemp.mid, mID);
    strictEqual(mTemp.isDrag, false);
    equal(mTemp.preX, 0);
    equal(mTemp.preY, 0);
});

test("iWeaponObject_onMouseDown", function() {
    me.input.mouse.pos.x = 100;
    me.input.mouse.pos.y = 100;
    select_item = 3;
    var mClass = new iWeaponObject(0, 0, {}, 1);
    mClass.isDrag = true;
    isDragable = true;
    notEqual(select_item, -1);
    mClass.onMouseDown();
    ok(mClass.isDrag);
    equal(select_item, mClass.mResource);
    ok(isDragable);
    equal(mClass.preX, mClass.pos.x);
    equal(mClass.preY, mClass.pos.y);
});

test("iWeaponObject_onMouseUp", function() {
    var mClass = new iWeaponObject(10, 10, {}, 1);
    mClass.isDrag = false;
    isDragable = false;
    mClass.onMouseUp();
    strictEqual(mClass.isDrag, false);
    strictEqual(SelectObject, null);
    strictEqual(isDragable, false);
    notEqual(mClass.pos.x, mClass.preX);
    notEqual(mClass.pos.y, mClass.preY);
});
/**/
test("iEngineObject", function() {
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iEngineObject(mX, mY, {}, mID);
    notStrictEqual(mTemp, null);
    equal(mTemp.mResource, 4);
    equal(mTemp.mid, mID);
    strictEqual(mTemp.isDrag, false);
    equal(mTemp.preX, 0);
    equal(mTemp.preY, 0);
});

test("iEngineObject_onMouseDown", function() {
    me.input.mouse.pos.x = 100;
    me.input.mouse.pos.y = 100;
    select_item = 4;
    var mClass = new iEngineObject(0, 0, {}, 1);
    mClass.onMouseDown();
    notEqual(select_item, -1);
    strictEqual(mClass.isDrag, false);
    equal(select_item, mClass.mResource);
    strictEqual(isDragable, false);
    equal(mClass.preX, mClass.pos.x);
    equal(mClass.preY, mClass.pos.y);
});

test("iEngineObject_onMouseUp", function() {
    var mClass = new iEngineObject(0, 0, {}, 1);
    mClass.onMouseUp();
    strictEqual(mClass.isDrag, false);
    strictEqual(isDragable, false);
    equal(mClass.pos.x, 0);
    equal(mClass.pos.y, 0);
});
test("iPowerObject", function() {
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iPowerObject(mX, mY, {}, mID);
    notStrictEqual(mTemp, null);
    equal(mTemp.mResource, 5);
    equal(mTemp.mid, mID);
    strictEqual(mTemp.isDrag, false);
    equal(mTemp.preX, 0);
    equal(mTemp.preY, 0);
});

test("iPowerObject_onMouseDown", function() {
    var mClass = new iPowerObject(0, 0, {}, 1);
    select_item = 5;
    mClass.onMouseDown();
    strictEqual(mClass.isDrag, false);
    equal(select_item, mClass.mResource);
    strictEqual(isDragable, false);
    equal(mClass.preX, 0);
    equal(mClass.preY, 0);
});

test("iPowerObject_onMouseUp", function() {
    var mClass = new iPowerObject(0, 0, {}, 1);
    mClass.onMouseUp();
    strictEqual(mClass.isDrag, false);
    strictEqual(SelectObject, null);
    notEqual(select_item, -1);
    strictEqual(isDragable, false);
    equal(mClass.pos.x, 0);
    equal(mClass.pos.y, 0);
});

test("iConsoleObject", function() {
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iConsoleObject(mX, mY, {}, mID);
    notStrictEqual(mTemp, null);
    equal(mTemp.mResource, 6);
    equal(mTemp.mid, mID);
    strictEqual(mTemp.isDrag, false);
    equal(mTemp.preX, 0);
    equal(mTemp.preY, 0);
});

test("iConsoleObject_onMouseDown", function() {
    var mClass = new iConsoleObject(0, 0, {}, 1);
    select_item = 6;
    mClass.onMouseDown();
    strictEqual(mClass.isDrag, false);
    equal(select_item, mClass.mResource);
    strictEqual(isDragable, false);
    equal(mClass.preX, 0);
    equal(mClass.preY, 0);
});

test("iConsoleObject_onMouseUp", function() {
    var mClass = new iConsoleObject(0, 0, {}, 1);
    mClass.onMouseUp();
    strictEqual(mClass.isDrag, false);
    strictEqual(SelectObject, null);
    notEqual(select_item, -1);
    strictEqual(isDragable, false);
    equal(mClass.pos.x, 0);
    equal(mClass.pos.y, 0);
});

test("iConsoleObject_checkItemPos", function() {
    var mClass = new iConsoleObject(0, 0, {}, 1);
    var mX = 0;
    var mY = 0;
    var de = 1;
    notStrictEqual(mClass, null);
    if(de >= 0 && de <= 3)
        ok(true);
    else
        strictEqual(true, false);
});

test("iComponentObject", function() {
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iComponentObject(mX, mY, {}, mID);
    notStrictEqual(mTemp, null);
    equal(mTemp.mResource, 7);
    equal(mTemp.mid, mID);
    strictEqual(mTemp.isDrag, false);
    equal(mTemp.preX, 0);
    equal(mTemp.preY, 0);
});

test("iComponentObject_onMouseDown", function() {
    var mClass = new iComponentObject(0, 0, {}, 1);
    select_item = 7;
    mClass.onMouseDown();
    strictEqual(mClass.isDrag, false);
    equal(select_item, mClass.mResource);
    strictEqual(isDragable, false);
    equal(mClass.preX, 0);
    equal(mClass.preY, 0);
});

test("iComponentObject_onMouseUp", function() {
    var mClass = new iComponentObject(0, 0, {}, 1);
    strictEqual(mClass.isDrag, false);
    strictEqual(SelectObject, null);
    notEqual(select_item, -1);
    strictEqual(isDragable, false);
    equal(mClass.pos.x, 0);
    equal(mClass.pos.y, 0);
});

test("iDoorObject", function() {
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iDoorObject(mX, mY, {}, mID);
    notStrictEqual(mTemp, null);
    equal(mTemp.mResource, 8);
    equal(mTemp.mid, mID);
    ok(mTemp.rotateFlag);
    strictEqual(mTemp.mfix, false);
    equal(mTemp.angle, Math.PI / 2);
});

test("iDoorObject_processRotate", function() {
    var mClass = new iDoorObject(0, 0, {}, 1);
    mClass.processRotate();
    ok(mClass.rotateFlag);
    notEqual(mClass.angle, 0);
    notEqual(mClass.width, 0);
    notEqual(mClass.height, 0);
});

    
test("iDoorObject_removeWallinCollision", function() {
    var mClass = new iDoorObject(0, 0, {}, 1);
    me.game.add(mClass);
    mClass.removeWallinCollision();
    strictEqual(me.game.collide(mClass), null);
    me.game.remove(mClass);
});

test("iWallObject", function() {
    var mX = 0;
    var mY = 0;
    var mID = 1;
    var mTemp = new iWallObject(mX, mY, {}, mID);
    notStrictEqual(mTemp, null);
    equal(mTemp.mResource, 9);
    equal(mTemp.mid, mID);
});

test("iWallObject_checkTopAndBottomWall", function() {
    var mClass = new iWallObject(0, 0, {}, 3);
    var mRet = mClass.checkTopAndBottomWall();
    switch(mRet){
    case 0:
        equal("None collide", 0, mRet);
        break;
    case 2:
        equal("collide with object else wall", 2, mRet);
        break;
    case 3:
        equal("collide with wall on topside", 3, mRet);
        break;
    case 4:
        equal("collide with wall on bottomside", 4, mRet);
        break;
    case 5:
        equal("collide with wall on top/bottomside", 5, mRet);
        break
    default:
        equal("Unknown value", 0, mRet);
    }
});

test("iWallObject_checkLeftAndRightWall", function() {
    var mClass = new iWallObject(0, 0, {}, 3);
    var mRet = mClass.checkLeftAndRightWall();
    switch(mRet){
    case 0:
        equal("None collide", 0, mRet);
        break;
    case 8:
        equal("collide with object else wall", 2, mRet);
        break;
    case 7:
        equal("collide with wall on leftside", 3, mRet);
        break;
    case 6:
        equal("collide with wall on rightside", 4, mRet);
        break;
    case 5:
        equal("collide with wall on left/right side", 5, mRet);
        break
    default:
        equal("Unknown value", 0, mRet);
    }
});

test("iWallObject_checkDirectWall", function() {
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
        ok(true);
    else
        strictEqual(true, false);
});
test("WallGroupObject", function() {
    var mClass = new WallGroupObject(1);
    equal(mClass.mid, 1);
    equal(mClass.mResource, 101);
    equal(mClass.WallPosX, 0);
    equal(mClass.WallPosY, 0);
    equal(mClass.mStarti, 0);
    equal(mClass.mWallObject.length, 0);
});

test("WallGroupObject_addWallObject", function() {
    var mClass = new WallGroupObject(1);
    var wallObj = mClass.addWallObject(100, 100);
    equal(mClass.mWallObject[mClass.mWallObject.length - 1] , wallObj);
});
    
test("WallGroupObject_removeWallObject", function() {
    var mClass = new WallGroupObject(1);
    var mWall = new iWallObject(0, 0, {}, 2);
    strictEqual(mClass.removeWallObject(mWall), false);
});

test("WallGroupObject_removeAll", function() {
    var mClass = new WallGroupObject(1);
    mClass.addWallObject(100, 100);
    mClass.addWallObject(100, 100);
    mClass.addWallObject(100, 100);
    mClass.removeAll(1);
    equal(mClass.mWallObject.length, 1);
});

test("WallGroupObject_getFirstWallObject", function() {
    var mClass = new WallGroupObject(1);
    mClass.addWallObject(100, 100);
    notStrictEqual(mClass.getFirstWallObject(), null);
});

test("WallGroupObject_setPrePostoCurPos", function() {
    var mClass = new WallGroupObject(1);
    mClass.addWallObject(100, 100);
    mClass.setPrePostoCurPos();
    equal(mClass.mWallObject[0].preX, mClass.mWallObject[0].pos.x);
    equal(mClass.mWallObject[0].preY, mClass.mWallObject[0].pos.y);
});

test("WallGroupObject_setCurPostoPrePos", function() {
    var mClass = new WallGroupObject(1);
    mClass.addWallObject(100, 100);
    mClass.setCurPostoPrePos();
    equal(mClass.mWallObject[0].preX, mClass.mWallObject[0].pos.x);
    equal(mClass.mWallObject[0].preY, mClass.mWallObject[0].pos.y);
});

test("makeJsonString", function() {
    var mClass = makeJsonString;
    equal(mClass.JsonString, "");
});

test("makeJsonString_setFirstString", function() {
    var mClass = makeJsonString;
    mClass.setFirstString();
    equal(mClass.JsonString, '{"Objects" : [');
});

test("makeJsonString_makeObjecttoString", function() {
    var mClass = makeJsonString;
    var mTemp1 = new iWallObject(0, 0, {}, 1);
    notStrictEqual(mTemp1, null);
    mClass.makeObjecttoString(mTemp1, true);
    equal(mClass.JsonString, '{"Objects" : [{"Resource":9,"id":1,"PosX":0,"PosY":0,"Fix":false,"angle":0,"animation":"hWall"}');
});

test("makeJsonString_setEndString", function() {
    var mClass = makeJsonString;
    mClass.JsonString = "";
    mClass.setEndString();
    equal(mClass.JsonString, ']}');
});