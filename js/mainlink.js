/*
 * JavaScript Code : 
*/

$(document).ready(function () {

    $(".items").click(function () {
        var idItem = $("img", this).attr("id");
        var itemName = idItem.substring(5, idItem.length);
        onMouseClickItem(itemName);
    });

    $("#file_save").click(function () {
        onButtonSaveClick();
    });

    $('#jsapp').contextMenu('myMenu1', {
        bindings: {
            'delete': function (t) {
                if (ui.selected) {
                    ship.remove(ui.selected);
                }
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
    ui.choose(itemName);
    return 0;
};
function onButtonSaveClick(){
    var strData = ship.toJsonString();
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
        ship.fromJsonString(jString);
        ui.mouseLockedOn = null;
    }
};



//TODO: move to utils
function displayMoveCursor()
{
    document.getElementById("jsapp").style.cursor="move";
}

function displayDefaultCursor()
{
    document.getElementById("jsapp").style.cursor="default";
}