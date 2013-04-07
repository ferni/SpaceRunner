/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, html, jsApp, ko, _ */

var BattleScreen = me.ScreenObject.extend({
    name: 'battle-screen',
    isReset: false,
    init: function() {
        'use strict';
        this.parent();
    },
    onResetEvent: function() {
        'use strict';
        this.parent();
        me.video.clearSurface(me.video.getScreenContext(), 'black');
        html.load('battle-screen');
        this.onHtmlLoaded();

        me.game.ship.showInScreen();

        this.isReset = true;
        jsApp.onScreenReset();
    },
    onDestroyEvent: function() {
        'use strict';
        this.isReset = false;
        html.clear();
    },
    onHtmlLoaded: function() {
        'use strict';

    }
});

