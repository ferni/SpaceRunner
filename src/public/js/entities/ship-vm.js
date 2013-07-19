/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

var ShipVM = Object.extend({
    itemVMs: [],
    unitVMs: [],
    /**
     *
     * @param shipModel {sh.Ship} the ship model.
     */
    init: function(shipModel) {
        'use strict';
        this.m = shipModel;
    },
    showInScreen: function() {
        'use strict';
        me.levelDirector.loadLevel(this.m.tmxName);
        me.game.add(this, 1);
    },
    /**
     * Updates melonJS objects for items to be drawn on the screen
     * according to the ship model.
     */
    update: function(){
        'use strict';
        var i, v, items, vms, hasVM, aux;
        items = this.m.built;
        vms = this.itemVMs;

        for(i = 0; i < items.length; i++) {
            hasVM = false;
            for(v = i; v < vms.length; v++) {
                if(items[i] === vms[v].m) {
                    hasVM = true;
                    break;
                }
            }
            if (hasVM) {
                //put vm at item's index position
                if(v != i){
                    aux = vms[v];
                    vms[v] = vms[i];
                    vms[i] = aux;
                }
            }else {
                //new vm
                vms.splice(i, 0, make.vm(items[i]));
                me.game.add(vms[i], vms[i].zIndex);
            }
        }
        //remove extra vms
        for(v = items.length; v < vms.length; v++) {
            me.game.remove(vms[v], true);
        }
        vms.splice(items.length, vms.length - items.length);
        return true;//true, to make MelonJS happy
    },
    draw: function(ctx) {
        'use strict';
        return true;
    },
    selected : function(){
        'use strict';
        return _.filter(this.unitVMs, function(u){
            return u.selected;
        });
    }
});