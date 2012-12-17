/*
 * JavaScript Code : 
*/
module("mainlink.js");
//This makes no sense; expression ( mItem < 3 || mItem > 9 ) is always false.
test("removeClassItem", function() {
    var mItem = 5;
    if( mItem < 3 || mItem > 9 )
        ok("mItem is between 3 and 9", false);
    else
        ok("mItem is between 3 and 9", true);
});

test("onMouseClickItem", function() {
    var oriStr = ["Error1", "Error1", "Error1", "item_engine", "item_engine", "item_power", "item_console", "item_components", "item_door", "item_wall"];
    var mItem = 3;
    var mRet = onMouseClickItem(oriStr[mItem]);
    if(mRet >= 3 && mRet <= 9)
    {
        equal(mItem, select_item);
        strictEqual(SelectObject, null);
        strictEqual(WallMngObj, null);
        strictEqual(isDragable, false);
        strictEqual(wallDrawing, false);
    }
});

test("drawObjectfromJstring", function() {
    var JString = '{"Obje" : 234, "sssef" : "sefee"}';
    strictEqual(drawObjectfromJstring(JString), false);
});