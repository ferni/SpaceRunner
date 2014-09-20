/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global HTMLIFrameElement, $, gs */

var ShipFrame = (function() {
    'use strict';
    /**
     *
     * @param battle sh.Battle A battle.
     * @param shipID int The ship ID.
     * @constructor
     */
    function ShipFrame(battle, shipID, eventHandler) {
        this.battle = battle;
        this.shipID = shipID;
        this.eventHandler = eventHandler;

    }

    function sendData(data, iframe) {
        iframe.contentWindow.postMessage(data, '*');
    }

    ShipFrame.prototype = {
        /**
         * Appear on screen
         */
        init: function(width, height) {
            //create iframe, pass the model and bind with onEvent
            var self = this,
                iframe = $('<iframe src="ship-frame" width="' + width +
                    '" height="' + height + '"/>')
                    .css({display: 'inline'})[0];
            $('#frames').append(iframe);
            //listen to messages from the iframe
            window.addEventListener('message', function(event) {
                if (event.source === iframe.contentWindow) {
                    if (event.data.eventName === 'ready') {
                        sendData({
                            type: 'start battle',
                            playerJson: gs.player.toJson(),
                            battleJson: self.battle.toJson(),
                            shipID: self.shipID
                        }, iframe);
                    } else {
                        self.eventHandler(event.data);
                    }
                }
            }, false);
            this.iframe = iframe;
        },
        runScript: function(scriptJson) {
            //pass the script to iframe
            sendData(scriptJson, this.iframe);
        }
    };
    return ShipFrame;
}());

