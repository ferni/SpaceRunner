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
        for (i = 0; i < sh.mapNames.length; i++) {

            tmxTileMap = new me.TMXTileMap(sh.mapNames[i], 0, 0);
            tmxTileMap.load();
            shipsClient[sh.mapNames[i]] = {
                hull: hullMap.get(tmxTileMap)
            };
        }
        $.post('ship/gethulls', function(shipsServer){

            console.log('shipsServer');
            console.log(shipsServer);
            console.log('ships client');
            console.log(shipsClient);

            for (i = 0; i < sh.mapNames.length; i++) {
                deepEqual(shipsClient[sh.mapNames[i]].hull,
                    shipsServer[sh.mapNames[i]].hull, sh.mapNames[i] +
                        "'s hull identical on server and client.");
            }

        }, 'json')
            .always(function(){
                start();
            });
    });
    asyncTest('"sh" object has the same' +
        ' properties in server and client.', function() {
        var propsClient = sh.getProperties(sh);
        expect(1);
        $.post('/general/sharedprops', function(data){
            var propsServer = data.properties;
            deepEqual(propsServer, propsClient, JSON.stringify(propsServer) +
                ' in server and client.');
        }, 'json')
            .always(function(){
                start();
            });
    });

}