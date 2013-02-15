/*global jQuery, $*/

var html = {
    load: function (screenId) {
        var screenHtml;
        if (this.stored[screenId]) {
            screenHtml = this.stored[screenId];
        } else {
            screenHtml = $('#' + screenId).html();
            this.stored[screenId] = screenHtml;
            $('#' + screenId).remove();
        }
        $('#screensUi').html(screenHtml);
    },
    stored: {},
    clear: function () {
        $('#screensUi').html('');
    }
};