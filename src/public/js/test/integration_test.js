/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

function registerTestsRequiringNodeJS(){
    module('INTEGRATION');
    asyncTest('hullMaps generated in server identical to client', function() {
        var shipsClient = hullMaps, i;

        $.post('ship/gethulls', function(shipsServer){

            console.log('shipsServer');
            console.log(shipsServer);
            console.log('ships client');
            console.log(shipsClient);

            for (i = 0; i < sh.mapNames.length; i++) {
                deepEqual(shipsClient[sh.mapNames[i]].map,
                    shipsServer[sh.mapNames[i]].map, sh.mapNames[i] +
                        "'s hull identical on server and client.");
                strictEqual(shipsClient[sh.mapNames[i]].width,
                    shipsServer[sh.mapNames[i]].width, 'width');
                strictEqual(shipsClient[sh.mapNames[i]].height,
                    shipsServer[sh.mapNames[i]].height, 'height');
            }
            shipsServer[sh.mapNames[0]].map[0] ='asdfasdfsdaf';
            notDeepEqual(shipsClient[sh.mapNames[0]].map,
                shipsServer[sh.mapNames[0]].map,
                'test fails if a map is changed'
            );

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