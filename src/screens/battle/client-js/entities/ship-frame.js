/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, HTMLIFrameElement, $*/
var gs = require('client/game-state'),
    _ = require('underscore')._;

module.exports = (function() {
    'use strict';
    /**
     *
     * @param {sh.Battle} battle A battle.
     * @param {sh.Ship} ship The relevant ship in the battle.
     * @param {Function} eventHandler Handler to catch messages from the iframe.
     * @constructor
     */
    function ShipFrame(battle, ship, eventHandler) {
        this.battle = battle;
        this.ship = ship;
        this.eventHandlers = [eventHandler];
    }

    ShipFrame.prototype = {
        /**
         * Appear on screen
         */
        init: function() {
            //create an iframe, pass the model and bind with onEvent
            var self = this,
                url = 'ship-frame/?width=' + (self.ship.width * gs.TILE_SIZE) +
                    '&height=' + (self.ship.height * gs.TILE_SIZE),
                iframe = $('<iframe src="' + url + '"/>')[0];
            $('#frames').append(iframe);
            //listen to messages from the iframe
            window.addEventListener('message', function(event) {
                console.log('frame -> page: ' + event.data.eventName);
                if (event.source === iframe.contentWindow) {
                    if (event.data.eventName === 'ready') {
                        self.sendData({
                            type: 'start battle',
                            playerJson: gs.player.toJson(),
                            battleJson: self.battle.toJson(),
                            shipID: self.ship.id
                        });
                    } else {
                        _.each(self.eventHandlers, function(handler) {
                            event.data.frame = self;
                            handler(event.data);
                        });
                    }
                }
            }, false);
            this.iframe = iframe;
        },
        runScript: function(scriptJson) {
            //pass the script to iframe
            this.sendData(scriptJson);
        },
        keyPressed: function(key) {
            this.sendData({type: 'key pressed', key: key});
        },
        sendData: function(data) {
            this.iframe.contentWindow.postMessage(data, '*');
            console.log('page -> frame: ' + data.type);
        }
    };
    return ShipFrame;
}());

