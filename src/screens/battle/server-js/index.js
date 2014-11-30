/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports, require*/

/**
 * Manages the battle from the server side.
 * @type {exports.BattleServer|*}
 */
exports.BattleServer = require('./battle-server').BattleServer;

/**
 * Inherits from BattleServer
 * @type {*}
 */
exports.ChallengeBattle = require('./challenge-battle').ChallengeBattle;

/**
 * Sets up a multiplayer battle.
 * @type {BattleSetUp}
 */
exports.BattleSetUp = require('./battle-set-up').BattleSetUp;
