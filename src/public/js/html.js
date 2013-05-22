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
        if (!this.stored[screenId]) {
            throw 'Could not find preloaded html for ' + screenId;
        }
        $('#screensUi').html(this.stored[screenId]);
    },
    store: function(screenId, success, error) {
        'use strict';
        var self = this;
        $.get(screenId+'.html', function(data) {
            self.stored[screenId] = data;
            if (success) {
                success();
            }
        }).fail(function() {
            if (error) {
                error();
            }
        });
    },
    stored: {},
    clear: function() {
        'use strict';
        $('#screensUi').html('');
    }
};

