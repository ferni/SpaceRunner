/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, battles*/

var sh = require('../public/js/shared'),
    auth = require('../auth'),
    BattleServer = require('./battle-server').BattleServer,
    _ = require('underscore')._;


/**
 * A model representing the battle set up (for the battle-set-up screen)
 * @param {{id, creator, shipJson}} params
 * @constructor
 */
exports.BattleSetUp = function(params) {
    'use strict';
    this.id = params.id;
    this.creator = params.creator;
    this.shipJson = params.shipJson;
    this.challenger = null; //player that joins
    this.battleServer = null;
    this.toJson = function() {
        return {
            id: this.id,
            battle: this.battleServer ?
                    this.battleServer.battleModel.toJson() : null,
            creator: this.creator ?
                    this.creator.toJson() : {name: '<empty>'},
            challenger: this.challenger ?
                    this.challenger.toJson() : {name: '<empty>'}
        };
    };
    this.isFull = function() {
        return this.challenger && this.creator;
    };
    this.addPlayer = function(player) {
        if (!this.isFull()) {
            this.challenger = player;
        } else {
            throw 'Cannot add player, battle is full';
        }
    };
    this.updatePlayers = function() {
        if (this.creator && !auth.isOnline(this.creator.id)) {
            this.creator = null;
        }
        if (this.challenger && !auth.isOnline(this.challenger.id)) {
            this.challenger = null;
        }
    };
    /**
     * Returns the battle.
     * @param {Function} done callback for when it creates the battle.
     * @this exports.BattleSetUp
     */
    this.createBattle = function(done) {
        var err = null,
            ship1,
            ship2,
            battleServer,
            U = sh.Unit;
        try {
            battleServer = new BattleServer({
                id: battles.length,
                shipJsons: [this.shipJson, this.shipJson]
            });
            ship1 = battleServer.battleModel.ships[0];
            ship1.owner = this.creator;
            ship1.putUnit(new U({imgIndex: 6, speed: 2}));
            ship1.putUnit(new U({imgIndex: 6, speed: 2}));
            ship1.putUnit(new U({imgIndex: 0, speed: 1.5}));
            ship1.putUnit(new U({imgIndex: 0, speed: 1.5}));

            ship2 = battleServer.battleModel.ships[1];
            ship2.owner = this.challenger;
            ship2.putUnit(new U({imgIndex: 7, speed: 1.5}));
            ship2.putUnit(new U({imgIndex: 7, speed: 1.5}));
            ship2.putUnit(new U({imgIndex: 12, speed: 2}));
            ship2.putUnit(new U({imgIndex: 12, speed: 2}));
            battles.push(battleServer);
            battleServer.nextTurn();
            this.battleServer = battleServer;
        } catch (e) {
            err = new Error(e);
        }
        done(err);
    };
};
