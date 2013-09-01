/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, $, sh*/

var server = {
    init: function(onDone) {
        'use strict';
        $.post('/general/init', function(data) {
            onDone(data);
        }, 'json')
            .fail(function() {
                throw 'Server error trying to initialize player.';
            });
    },
    disconnect: function() {
        'use strict';
        $.post('/general/disconnect', function(data) {
        }, 'json');
    },
    createBattle: function(ship, onDone) {
        'use strict';
        console.log('Creating battle...');
        $.post('/battle-set-up/create', {shipJsonString: ship.toJsonString()},
            function(data) {
                console.log('Battle created');
                data.creator = sh.make.playerFromJson(data.creator);
                onDone(data);
            }, 'json');
    },
    joinBattle: function(battleID, onDone) {
        'use strict';
        console.log('Joining battle...');
        $.post('/battle-set-up/join', {battleID: battleID},
            function(data) {
                if (!data.error) {
                    onDone();
                } else {
                    console.error('Attempted to join a full battle');
                }
            }, 'json');
    },
    getBattle: function(battleID, onDone) {
        'use strict';
        $.post('/battle/getmodel', {id: battleID}, function(battleModel) {
            onDone(battleModel);
        });
    }
};
