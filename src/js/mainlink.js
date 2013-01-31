/*global $, me, jsApp, ship, ui, AjaxUpload*/

function onButtonSaveClick() {
    'use strict';
    var strData = ship.toJsonString(),
    strName = 'ship_building.sav';
    window.open('php/download.php?data=' + strData + '&name=' + strName);
}

function onButtonLoadClick(jString) {
    'use strict';
    if (jString) {
        ship.fromJsonString(jString);
        ui.mouseLockedOn = null;
    }
}

$(document).ready(function() {
    'use strict';
    var ajax;
    $('.items').click(function() {
        var idItem, itemName;
        if (me.state.isCurrent(me.state.LOADING)) {
            return;
        }
        idItem = $('img', this).attr('id');
        itemName = idItem.substring(5, idItem.length);
        ui.choose(itemName);
    });
    $('#file_save').click(function() {
        onButtonSaveClick();
    });
    $(document).bind('contextmenu', function(e) {
        return false;
    });
    ajax = new AjaxUpload($('#file_load'), {
        action: 'php/upload.php',
        name: 'uploadfile',
        onSubmit: function(file, ext) {},
        onComplete: function(file, response) {
            onButtonLoadClick(response);
        }
    });
});


