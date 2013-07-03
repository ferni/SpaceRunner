
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

screens.register('battle-set-up', GameScreen.extend({

    onReset: function(settings) {
        this.id = settings.id;
        this.creator = settings.creator;
        alert('the creator name is '+ this.creator.name);
    },
    onHtmlLoaded : function(){
        var ViewModel = function(){
            this.playerLeft = ko.observable();
            this.playerRight = ko.observable();
            this.ready = function(){

            };
        };
        ko.applyBindings(new ViewModel(), document.getElementById('battle-set-up-screen'));
    }
}));