/*
 * JavaScript Code : 
*/

$(document).ready(function(){

    $("#item_weapon").click(function(){
        onMouseClickItem("item_weapon");
    });

    $("#item_engine").click(function(){
        onMouseClickItem("item_engine");
    });

    $("#item_power").click(function(){
        onMouseClickItem("item_power");
    });

    $("#item_console").click(function(){
        onMouseClickItem("item_console");
    });

    $("#item_components").click(function(){
        onMouseClickItem("item_components");
    });

    $("#item_door").click(function(){
        onMouseClickItem("item_door");
    });

    $("#item_wall").click(function(){
        onMouseClickItem("item_wall");
    });

    $("#file_save").click(function(){
        onButtonSaveClick();
    });

    $('#jsapp').contextMenu('myMenu1', {
        bindings: {
          'delete': function(t) {
              if(select_item == -1 && !SelectObject && DeleteObject)
                  onMouseClickItem(-1);
          }
        }
    });
});

function removeClassItem(i){
    switch(i){
        case 3: /* item_weapon */
            $("#item_weapon").removeClass("selection_item");
            break;
        case 4: /* item_engine */
            $("#item_engine").removeClass("selection_item");
            break;
        case 5:
            $("#item_power").removeClass("selection_item");
            break;
        case 6:
            $("#item_console").removeClass("selection_item");
            break;
        case 7:
            $("#item_components").removeClass("selection_item");
            break;
        case 8:
            $("#item_door").removeClass("selection_item");
            break;
        case 9:
            $("#item_wall").removeClass("selection_item");
            break;
    }
};

function addClassItem(i){
    switch(i){
        case 3: /* item_weapon */
            $("#item_weapon").addClass("selection_item");
            break;
        case 4: /* item_engine */
            $("#item_engine").addClass("selection_item");
            break;
        case 5:
            $("#item_power").addClass("selection_item");
            break;
        case 6:
            $("#item_console").addClass("selection_item");
            break;
        case 7:
            $("#item_components").addClass("selection_item");
            break;
        case 8:
            $("#item_door").addClass("selection_item");
            break;
        case 9:
            $("#item_wall").addClass("selection_item");
            break;
    }
};

function onMouseClickItem(nameItem){

    var new_item = -1;

    switch(nameItem){
        case "item_weapon":
            new_item = 3;
            break;
        case "item_engine":
            new_item = 4;
            break;
        case "item_power":
            new_item = 5;
            break;
        case "item_console":
            new_item = 6;
            break;
        case "item_components":
            new_item = 7;
            break;
        case "item_door":
            new_item = 8;
            break;
        case "item_wall":
            new_item = 9;
            break;
    }

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
    if(ParseStr == null)
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