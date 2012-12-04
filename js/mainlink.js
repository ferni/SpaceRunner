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
    
//    $("#file_load").click(function(){
//        onButtonLoadClick();
//    });
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
    
    if( select_item == new_item )
        return;
        
    removeClassItem(select_item);
    addClassItem(new_item);
    
    if(SelectObject){
        checkCollision.removeRedStyle();
        me.game.remove(SelectObject);
        delete SelectObject;
        SelectObject = null;
        me.game.sort();
        me.game.repaint();
    }
    
    if(WallMngObj)
    {
        delete WallMngObj;
        WallMngObj = null;
    }
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
//             if (! (ext && /^(sav)$/.test(ext))){ 
                // extension is not allowed 
//                    status.text('Only JPG, PNG or GIF files are allowed');
//                alert("file format error");
//                return false;
//            }
//                status.text('Uploading...');
        },
        
        onComplete: function(file, response){
            //On completion clear the status
            onButtonLoadClick(response);
        }
    });
    
});

function onButtonLoadClick(jString){
    alert(jString);
    var LoadProc = LoadDraw;
    
    LoadProc.init();
    jsApp.initLevel();
    LoadProc.draw(jString);
};

