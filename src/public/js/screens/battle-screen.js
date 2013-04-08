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

        this.putUnits();

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

    },
    putUnits: function(){
        'use strict';
        //find empty spot
        var empty = null;
        utils.matrixTiles(me.game.ship.width, me.game.ship.height,
            function(x, y){
                if(empty){
                    return;
                }
                if(me.game.ship.mapAt(x, y) == charMap.codes._cleared){
                    empty = {x: x, y: y};
                }
            });
        var unit = new Unit(empty.x, empty.y);
        me.game.add(unit, unit.zIndex);
    }
});

