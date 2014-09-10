/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

var ShipFrame = (function() {
    'use strict';
    /**
     *
     * @param ship sh.Ship A ship.
     * @param onEvent Function Callback for emitted events.
     * @constructor
     */
    function ShipFrame(ship, onEvent) {
        this.ship = ship;
        this.onEvent = onEvent;
    }

    ShipFrame.prototype = {
        /**
         * Appear on screen
         */
        init: function(x, y, width, height) {
            //create iframe, pass the model and bind with onEvent
        },
        runScript: function(script) {
            //pass the script to iframe
        }
    };
    return ShipFrame;
}());

