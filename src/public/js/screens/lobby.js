/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, GameScreen, screens, ko, server, gs, $, sh, prebuilt*/

screens.register('lobby', GameScreen.extend({
    init: function(name) {
        'use strict';
        this.parent(name);
    },
    onReset: function() {
        'use strict';
        //do stuff here
        return 0;
    },
    onDestroy: function() {
        'use strict';
        return 0;
    },
    onHtmlLoaded: function() {
        'use strict';
        //get battle info from server
        var screen = this,
            HtmlViewModel = function(data) {
                this.playerName = ko.observable(gs.player.name);
                this.battleSetUps = ko.observableArray(data.battleSetUps);
                this.joinBattle = function(battleSetUp) {
                    server.joinBattle(battleSetUp.id, function() {
                        me.state.change('battle-set-up', battleSetUp);
                    });
                };
                this.hostBattle = screen.hostBattle;
                this.startChallenge = screen.startChallenge;
            };
        $.post('/lobby/get', function(data) {
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
    startChallenge: function() {
        'use strict';
        $.post('/lobby/newchallenge', function(battle) {
            me.state.change('battle', battle);
        }, 'json');
    },
    hostBattle: function() {
        'use strict';
        if (gs.modes.useprebuilt) {
            server.createBattle(new sh.Ship({json: prebuilt.humanoid}),
                function(settings) {
                    me.state.change('battle-set-up', settings);
                });
        } else {
            me.state.change('ship-select');
        }
    }
}));
