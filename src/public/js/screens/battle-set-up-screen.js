/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, screens, ConnectedScreen, ko, gs, $*/

screens.register('battle-set-up', ConnectedScreen.extend({

    onReset: function(settings) {
        'use strict';
        this.parent(settings);
        this.id = settings.id;
        this.creator = settings.creator;
    },
    onHtmlLoaded: function() {
        'use strict';
        return 0;
    },

    bothPlayersPresent: function() {
        'use strict';
        return this.data &&
            this.data.creator.id !== undefined &&
            this.data.challenger.id !== undefined;
    },
    /**
     * Loads the knockout vm to bind it to the HTML
     */
    initVM: function() {
        'use strict';
        var screen = this;
        this.vm = ko.mapping.fromJS(this.data);
        this.vm.imCreator = ko.computed(function() {
            return this.creator.id() === gs.player.id;
        }, this.vm);
        this.vm.start = function() {
            //both players present
            if (screen.bothPlayersPresent()) {
                $.post(screen.name + '/start', {id: this.id()},
                    function(data) {
                        //nothing (battle starts in updateVM )
                    }, 'json');
            } else {
                alert('More players are required to start.');
            }
        };
        ko.applyBindings(this.vm,
            document.getElementById('battle-set-up-screen'));
    },
    updateVM: function() {
        'use strict';
        ko.mapping.fromJS(this.data, this.vm);
        if (this.data.battle) {
            //this means it started!
            me.state.change('battle', new sh.Battle(this.data.battle));
        }
        //this somehow makes both players use different battle ids.
        /*if(gs.modes.auto && this.bothPlayersPresent()) {
            this.vm.start();
        }*/
    },
    onData: function() {
        'use strict';
        if (!this.dataExecuted) {//is first time
            this.initVM();
            this.dataExecuted = true;
        } else {
            this.updateVM();
        }
    }
}));
