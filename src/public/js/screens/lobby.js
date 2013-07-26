/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, screens-html, GameScreen*/

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
                    server.joinBattle(battleSetUp.id, function(){
                        me.state.change('battle-set-up', battleSetUp);
                    });
                };
                this.hostBattle = screen.hostBattle;
            };
        $.post('/lobby/get', function(data) {
            gs.player = sh.make.playerFromJson(data.player);
            screen.vm = new HtmlViewModel(data);
            ko.applyBindings(screen.vm,
                document.getElementById('screensUi'));
            if (gs.modes.auto) {
                if (data.battleSetUps.length <= 0) {
                    screen.hostBattle();
                } else {
                    screen.vm.joinBattle(data.battleSetUps[0]);
                }
            }
        }, 'json');
    },

    hostBattle: function() {
        me.state.change('ship-select');
    }
}));
