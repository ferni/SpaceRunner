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
                this.playerName = ko.observable(data.playerName);
                this.battles = ko.observableArray(data.battles);
                this.joinBattle = function(battle) {
                    if(battle.playerLeft === null ||
                        battle.playerRight === null){
                        server.joinBattle(battle.id);
                    }
                    else{
                        alert('That battle is full');
                    }
                };
                this.hostBattle = screen.hostBattle;
            };
        $.get('/lobby/get', function(data) {
            gameState.playerName = data.playerName;
            ko.applyBindings(new HtmlViewModel(data),
                document.getElementById('screensUi'));
        });
    },

    hostBattle: function() {
        me.state.change('ship-select');
    }
}));
