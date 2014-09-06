/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global require, exports, battles*/

var sh = require('../public/js/shared'),
    auth = require('../auth'),
    Battle = require('./battle').Battle,
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
    this.battle = null;
    this.toJson = function() {
        return {
            id: this.id,
            battle: this.battle ?
                    this.battle.tempSurrogate.toJson() : null,
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
            ship,
            battle;
        try {
            ship = new sh.Ship({json: this.shipJson});
            battle = new Battle({id: battles.length, ship: ship});
            ship.putUnit({imgIndex: 6, speed: 2, ownerID: this.creator.id});
            ship.putUnit({imgIndex: 6, speed: 2, ownerID: this.creator.id});
            ship.putUnit({imgIndex: 0, speed: 1.5, ownerID: this.creator.id});
            ship.putUnit({imgIndex: 0, speed: 1.5, ownerID: this.creator.id});

            ship.putUnit({imgIndex: 7, speed: 1.5,
                ownerID: this.challenger.id});
            ship.putUnit({imgIndex: 7, speed: 1.5,
                ownerID: this.challenger.id});
            ship.putUnit({imgIndex: 12, speed: 2, ownerID: this.challenger.id});
            ship.putUnit({imgIndex: 12, speed: 2, ownerID: this.challenger.id});
            battle.tempSurrogate.players = [this.creator, this.challenger];
            battles.push(battle);
            battle.nextTurn();
            this.battle = battle;
        } catch (e) {
            err = new Error(e);
        }
        done(err);
    };
};