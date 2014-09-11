/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global HTMLIFrameElement, $ */

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
        init: function(x, y, width, height) {
            //create iframe, pass the model and bind with onEvent
            var self = this,
                iframe = $('<iframe href="ship-frame" width="' + width +
                    '" height="' + height + '"/>')
                    .css({position: 'absolute', top: y, left: x})[0];
            $('#screensUi').append(iframe);
            //listen to messages from the iframe
            window.addEventListener('message', function(event) {
                if (event.source === iframe.contentWindow) {
                    self.eventHandler(event.data);
                }
            }, false);

            sendData({
                battleJson: self.battle.toJson(),
                shipID: self.shipID
            }, iframe);
            this.iframe = iframe;
        },
        runScript: function(script) {
            //pass the script to iframe
            sendData(script.toJson(), this.iframe);
        }
    };
    return ShipFrame;
}());

