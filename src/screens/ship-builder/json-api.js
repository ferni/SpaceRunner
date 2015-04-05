/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, hullMaps*/
/*jslint unparam:true*/
var prebuiltShips = require('../../state/prebuilt-ships');

exports.ship = {
    /**
     * Saves the ship
     * @param {Object} req The request object.
     * @param {Object} res The response object.
     */
    save: function(req, res) {
        'use strict';
        var data = req.body;
        prebuiltShips.update(data.hullID, {
            'shipJson': data.jsonString,
            'name': data.name,
            'tier': data.tier
        }).then(function() {
            res.json({});
        }).catch (function(e) {
            res.json({error: e});
        });
    },
    /**
     * Gets the hull maps.
     * @param {Object} req
     * @param {Object} res
     */
    gethulls: function(req, res) {
        'use strict';
        res.json(hullMaps);
    }
};
