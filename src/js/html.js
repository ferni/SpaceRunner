/*global jQuery, $*/

/*For handling the screens' html*/
var html = {
    load: function (screenId) {
        var screenHtml;
        if (this.stored[screenId]) {
            screenHtml = this.stored[screenId];
        } else {
            screenHtml = this.store(screenId);
        }
        $('#screensUi').html(screenHtml);
    },
    /**
    *deletes html from the dom and stores it in stored
    *returns stored html
    */
    store: function (screenId) {
        var node = $('#' + screenId)[0];
        if (!node) {
            console.error('#' + screenId + ' not found in html');
            return '';
        }
        var screenHtml = $('#' + screenId)[0].outerHTML;
        this.stored[screenId] = screenHtml;
        $('#' + screenId).remove();
        return screenHtml;
    },
    stored: {},
    clear: function () {
        $('#screensUi').html('');
    }
};