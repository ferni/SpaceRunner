/*
 * JavaScript Code : 
*/

$(document).ready(function(){

    $(".items").click(function(){
        var idItem = $("img", this).attr("id");
        var itemName = idItem.substring(5, idItem.length);
        onMouseClickItem(itemName);
    });

    $("#file_save").click(function(){
        onButtonSaveClick();
    });

    $('#jsapp').contextMenu('myMenu1', {
        bindings: {
          'delete': function(t) {
              if(select_item == -1 && !SelectObject && DeleteObject)
                  onMouseClickItem();
          }
        }
    });
});

function removeClassItem(idxItem){
    var item = items.getBy("index", idxItem);
    var itemName = "";
    if (item) itemName = item.name;
    $("#item_"+itemName).removeClass("selection_item");
};

function addClassItem(idxItem){
    var item = items.getBy("index", idxItem);
    var itemName = "";
    if (item) itemName = item.name;
    $("#item_"+itemName).addClass("selection_item");
};

//If it's called without parameteres, unselects the item (sets select_item to -1)
function onMouseClickItem(itemName){

    var new_item;

    if(itemName === undefined)
        new_item = -1;
    else        
        new_item = items[itemName].index;

    if(new_item === undefined || new_item === null){
        console.error("No such item '"+itemName+"'. (onMouseClickItem(itemName))");
        return 0;
    }

    ui.choose(itemName);
    return 0;
//    if( select_item == new_item )
//        return;

    removeClassItem(select_item);
    addClassItem(new_item);

    if(select_item == -1 && new_item == -1 && !SelectObject && DeleteObject)
    {
        DeleteObject.setWalkable();
        checkCollision.removeRedStyle();
        if( DeleteObject.mResource != 101 )
        {
            if(DeleteObject.mfix == true)
                DeleteObject.setWalkable();
            me.game.remove(DeleteObject);
            delete DeleteObject;
        }
        else{
            DeleteObject.removeAll(0);
            ObjectsMng.removeObject(DeleteObject);
        }
    }
    else if(SelectObject && select_item != new_item){
        checkCollision.removeRedStyle();
        if( SelectObject.mResource != 101 )
        {
            if(SelectObject.mfix == true)
                SelectObject.setWalkable();
            me.game.remove(SelectObject);
            delete SelectObject;
        }
        else{
            SelectObject.setWalkable();
            SelectObject.removeAll(0);
            ObjectsMng.removeObject(SelectObject);
        }
    }
    SelectObject = null;
    DeleteObject = null;
    me.game.sort();
    me.game.repaint();
    isDragable = false;
    wallDrawing = false;
    select_item = new_item;
};
function onButtonSaveClick(){
    var JsonString = makeJsonString;
    var strData = JsonString.makeString();
    var strName = 'ship_building.sav';
    window.open("php/download.php?data=" + strData + "&name=" + strName);
};

$(function(){
    var btnUpload=$('#file_load');
//        var status=$('#status');
    new AjaxUpload(btnUpload, {
        action: 'php/upload.php',
        name: 'uploadfile',
        onSubmit: function(file, ext){
        },

        onComplete: function(file, response){
            //On completion clear the status
            onButtonLoadClick(response);
        }
    });
    
});

function onButtonLoadClick(jString){
    if(jString)
    {
        jsApp.initLevel();
        drawObjectfromJstring(jString);
    }
};

function drawObjectfromJstring(JString){
    var i = 0;
    var j = 0;
    var ParseStr = null;
    var ParseItem = null;
    var subParseItem = null;
    var OneObject = null;
    var SubObject = null;
    ParseStr = JSON.parse(JString);
    if(ParseStr == null || ParseStr.Objects == undefined)
        return false;
    for(i = 0; i < ParseStr.Objects.length; i ++){
        ParseItem = ParseStr.Objects[i];
        if(!ParseItem)
            return false;
        switch(ParseItem.Resource){
        case 3://weapon
            OneObject = new iWeaponObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
            OneObject.angle = ParseItem.angle;
            OneObject.mfix = ParseItem.Fix;
            me.game.add( OneObject, 100 );
            break;
        case 4://engine
            OneObject = new iEngineObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
            OneObject.angle = ParseItem.angle;
            OneObject.mfix = ParseItem.Fix;
            me.game.add( OneObject, 100 );
            break;
        case 5://power
            OneObject = new iPowerObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
            OneObject.angle = ParseItem.angle;
            OneObject.mfix = ParseItem.Fix;
            me.game.add( OneObject, 100 );
            break;
        case 6://console
            OneObject = new iConsoleObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
            OneObject.angle = ParseItem.angle;
            OneObject.mfix = ParseItem.Fix;
            me.game.add( OneObject, 100 );
            break;
        case 7://component
            OneObject = new iComponentObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
            OneObject.setCurrentAnimation(ParseItem.animation);
            OneObject.angle = ParseItem.angle;
            OneObject.mfix = ParseItem.Fix;
            me.game.add( OneObject, 100 );
            break;
        case 8://door
            OneObject = new iDoorObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
            OneObject.setCurrentAnimation(ParseItem.animation);
            OneObject.angle = ParseItem.angle;
            OneObject.mfix = ParseItem.Fix;
            me.game.add( OneObject, 100 );
            break;
        case 9://wall
            OneObject = new iWallObject(ParseItem.PosX, ParseItem.PosY, {}, ParseItem.id);
            OneObject.angle = ParseItem.angle;
            OneObject.mfix = ParseItem.Fix;
            me.game.add( OneObject, 100 );
            break;
        case 101://Wall Group
            OneObject = new WallGroupObject(ParseItem.id);
            ObjectsMng.addObject(OneObject);
            for(j = 0; j < ParseItem.Walls.length; j ++)
            {
                subParseItem = ParseItem.Walls[j];
                if(!subParseItem)
                    break;
                switch(subParseItem.Resource){
                case 8://door
                    SubObject = new iDoorObject(subParseItem.PosX, subParseItem.PosY, {}, subParseItem.id);
                    SubObject.setCurrentAnimation(subParseItem.animation);
                    SubObject.angle = subParseItem.angle;
                    SubObject.mfix = subParseItem.Fix;
                    me.game.add( SubObject, 101 );
                    OneObject.addOtherObject(SubObject);
                    break;
                case 9://wall
                    SubObject = OneObject.addWallObject(subParseItem.PosX, subParseItem.PosY);
                    SubObject.angle = subParseItem.angle;
                    SubObject.mfix = subParseItem.Fix;
                    break;
                }
            }
        }
    }
    me.game.sort();
    me.game.repaint();
    return true;
};

function displayMoveCursor()
{
    document.getElementById("jsapp").style.cursor="move";
}

function displayDefaultCursor()
{
    document.getElementById("jsapp").style.cursor="default";
}