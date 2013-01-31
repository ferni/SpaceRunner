/*
 * JavaScript Code :
 */

$(document).ready(function() {

    $('.items').click(function() {
        if (me.state.isCurrent(me.state.LOADING)) return;
        var idItem = $('img', this).attr('id');
        var itemName = idItem.substring(5, idItem.length);
        ui.choose(itemName);
    });

    $('#file_save').click(function() {
        onButtonSaveClick();
    });
    $(document).bind('contextmenu', function(e) {
        return false;
    });

    var btnUpload = $('#file_load');
    new AjaxUpload(btnUpload, {
        action: 'php/upload.php',
        name: 'uploadfile',
        onSubmit: function(file, ext) {},
        onComplete: function(file, response) {
            onButtonLoadClick(response);
        }
    });
});

function onButtonSaveClick() {
    var strData = ship.toJsonString();
    var strName = 'ship_building.sav';
    window.open('php/download.php?data=' + strData + '&name=' + strName);
}

function onButtonLoadClick(jString) {
    if (jString) {
        ship.fromJsonString(jString);
        ui.mouseLockedOn = null;
    }
}