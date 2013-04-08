/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global $ */

/*For handling the screens' html*/
var html = {
    load: function(screenId) {
        'use strict';
        var screenHtml;
        if (this.stored[screenId]) {
            screenHtml = this.stored[screenId];
        } else {
            screenHtml = this.store(screenId);
        }
        $('#screensUi').html(screenHtml);
    },
    //deletes html from the dom and stores it in stored
    //returns stored html
    store: function(screenId) {
        'use strict';
        var node = $('#' + screenId)[0],
            screenHtml;
        if (!node) {
            console.warn('#' + screenId + ' not found in html');
            return '';
        }
        screenHtml = $('#' + screenId)[0].outerHTML;
        this.stored[screenId] = screenHtml;
        $('#' + screenId).remove();
        return screenHtml;
    },
    stored: {},
    clear: function() {
        'use strict';
        $('#screensUi').html('');
    }
};

