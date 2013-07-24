
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

screens.register('battle-set-up', ConnectedScreen.extend({

    onReset: function(settings) {
        this.parent(settings);
        this.id = settings.id;
        this.creator = settings.creator;
    },
    onHtmlLoaded : function(){

    },
    onDataInit: function(){
        var screen = this;
        this.vm = ko.mapping.fromJS(this.data);
        this.vm.imCreator = ko.computed(function(){
            return this.creator.id() == gs.player.id;
        }, this.vm);
        this.vm.start = function(){
            //both players present
            if(typeof screen.data.creator.id !== 'undefined'
                && typeof screen.data.challenger.id !== 'undefined') {
                $.post(screen.name + '/start', {id: this.id()},
                function(data){
                    //nothing (battle starts in onDataUpdated )
                },'json');
            }else{
                alert('More players are required to start.');
            }
        };
        ko.applyBindings(this.vm,
            document.getElementById('battle-set-up-screen'));
    },
    onDataUpdated: function(){
        ko.mapping.fromJS(this.data, this.vm);
        if(this.data.battle) {
            //this means it started!
            gs.ship =  new sh.Ship({jsonString: this.data.battle.ship});
            me.state.change('battle', {id: this.data.battle.id});
        }
    }
}));