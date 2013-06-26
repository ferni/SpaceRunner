/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

function registerTestsRequiringNodeJS(){
    module('INTEGRATION');
    asyncTest('hullMaps generated in server identical to client', function() {
        var shipsClient = {}, i, tmxTileMap;
        for (i = 0; i < shared.mapNames.length; i++) {

            tmxTileMap = new me.TMXTileMap(shared.mapNames[i], 0, 0);
            tmxTileMap.load();
            shipsClient[shared.mapNames[i]] = {
                hull: hullMap.get(tmxTileMap)
            };
        }
        $.post('ship/gethulls', function(shipsServer){

            console.log('shipsServer');
            console.log(shipsServer);
            console.log('ships client');
            console.log(shipsClient);

            for (i = 0; i < shared.mapNames.length; i++) {
                deepEqual(shipsClient[shared.mapNames[i]].hull,
                    shipsServer[shared.mapNames[i]].hull, shared.mapNames[i] +
                        "'s hull identical on server and client.");
            }

        }, 'json')
            .always(function(){
                start();
            });
    });
}