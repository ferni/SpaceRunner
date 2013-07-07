/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, screens, GameScreen*/

screens.register('lobby', GameScreen.extend({
    init: function(name) {
        'use strict';
        this.parent(name);
    },
    onReset: function() {
        'use strict';
        //do stuff here
    },
    onDestroy: function(){
        'use strict';
    },
    onHtmlLoaded: function() {
        'use strict';
        //get battle info from server
        var screen = this,
            HtmlViewModel = function(data) {
                this.playerName = ko.observable(data.player.name);
                this.battleSetUps = ko.observableArray(data.battleSetUps);
                this.joinBattle = function(battleSetUp) {
                    console.log('Joining battle...');
                    $.post('/battles/join', {battleID: battleSetUp.id},
                        function(data) {
                            if (!data.error) {
                                me.state.change('battle-set-up', battleSetUp);
                            } else {
                                console.error('Attempted to join a full battle');
                            }
                        }, 'json');
                };
                this.hostBattle = screen.hostBattle;
            };
        $.get('/lobby/get', function(data) {
            gameState.player = sh.fromJson(data.player);
            ko.applyBindings(new HtmlViewModel(data),
                document.getElementById('screensUi'));
        });
    },

    hostBattle: function() {
        me.state.change('ship-select');
    }
}));
