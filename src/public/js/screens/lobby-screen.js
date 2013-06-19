/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

var LobbyScreen = me.ScreenObject.extend({
    name: 'template-screen',
    isReset: false,
    init: function() {
        'use strict';
        this.parent();
    },
    onResetEvent: function() {
        'use strict';
        this.parent();
        me.video.clearSurface(me.video.getScreenContext(), 'gray');
        html.load('lobby-screen');
        this.onHtmlLoaded();

        //do stuff here

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
        //get battle info from server
        var screen = this,
            HtmlViewModel = function(data) {
                this.playerName = ko.observable(data.playerName);
                this.battles = ko.observableArray(data.battles);
                this.joinBattle = function(battle) {
                    screen.joinBattle(battle.id);
                };
                this.hostBattle = screen.hostBattle;
            };
        $.get('/lobby/get', function(data) {
            ko.applyBindings(new HtmlViewModel(data));
        });
    },
    joinBattle: function(battleID) {
        console.log('Joining battle...');
        $.post('/battles/join', {battleID: battleID},
            function(data) {
                me.state.change(me.state.BATTLE,
                    {shipJsonString: data.shipJsonString});
            }, 'json');
    },
    hostBattle: function() {
        me.state.change(me.state.SELECT);
    }
});
