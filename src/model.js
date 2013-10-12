/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, battles*/

var Class = require('./class'),
    sh = require('./public/js/shared'),
    auth = require('./auth'),
    _ = require('underscore')._;


function BattleTurn(params) {
    'use strict';
    this.id = params.id;
    this.battle = params.battle;
    this.playersOrders = {};
    this.playersOrders[this.battle.playerLeft.id] = {};
    this.playersOrders[this.battle.playerRight.id] = {};
    //all the players ids that have submitted the orders
    this.playersSubmitted = [];
    this.script = null;
    this.addOrders = function(orders, playerID) {
        var self = this;
        if (!this.battle.isPlayerInIt(playerID)) {
            throw 'Player ' + playerID + ' is not in the battle.';
        }
        _.each(orders, function(order) {
            self.playersOrders[playerID][order.unitID] = order;
        });
    };
    this.isPlayerReady = function(playerID) {
        return _.any(this.playersSubmitted, function(id) {
            return id === playerID;
        });
    };
    this.setPlayerReady = function(playerID) {
        this.playersSubmitted.push(playerID);
    };
}

/**
 * A model representing a battle.
 * @param {{id,ship}} parameters
 * @constructor
 */
exports.Battle = Class.extend({
    //The players currently in this battle
    playerLeft: null,
    playerRight: null,
    numberOfPlayers: 2,
    turnCount: 0,
    currentTurn: null,

    receivedTheScript: [], //players ids that received the script
    turnDuration: 3000,
    winner: null,
    init: function(parameters) {
        'use strict';
        this.id = parameters.id;
        this.ship = parameters.ship;
    },
    /**
     * Informs that some player has received the script.
     * When all players in the battle receive the script,
     * a new turn is created.
     * @param {int} playerID The player ID.
     * @return {boolean} If the next turn was created or not.
     * @this exports.Battle
     */
    registerScriptReceived: function(playerID) {
        'use strict';
        this.receivedTheScript.push(playerID);
        if (_.uniq(this.receivedTheScript).length >= this.numberOfPlayers) {
            //all players have received the script, create next turn
            this.nextTurn();
            return true;
        }
        return false;
    },
    nextTurn: function() {
        'use strict';
        this.turnCount++;
        this.currentTurn = new BattleTurn({id: this.turnCount, battle: this});
        this.receivedTheScript = [];

    },
    isPlayerInIt: function(playerID) {
        'use strict';
        return (this.playerLeft && this.playerLeft.id === playerID) ||
            (this.playerRight && this.playerRight.id === playerID);
    },
    generateScript: function() {
        'use strict';
        var turn = this.currentTurn,
            orders = _.extend(turn.playersOrders[this.playerLeft.id],
                turn.playersOrders[this.playerRight.id]);

        console.log('all orders' + JSON.stringify(orders));
        turn.script = sh.createScript(orders, this.ship, this.turnDuration);
    },
    toJson: function() {
        'use strict';
        return {
            id: this.id,
            ship: this.ship.toJsonString(),
            playerLeft: this.playerLeft.toJson(),
            playerRight: this.playerRight.toJson()
        };
    }
});

/**
 * A battle for the "Challenge" menu option.
 * @type {*}
 */
exports.ChallengeBatte = exports.Battle.extend({
    init: function(params) {
        'use strict';
        var ship = new sh.Ship({jsonString: '{"tmxName":"Mechanoid_Cruiser",' +
            '"buildings":[{"type":"door","x":14,"y":11,"r":true},' +
            '{"type":"wall","x":14,"y":8,"r":false},' +
            '{"type":"wall","x":17,"y":8,"r":false},' +
            '{"type":"door","x":15,"y":8,"r":false},' +
            '{"type":"wall","x":14,"y":15,"r":false},' +
            '{"type":"wall","x":17,"y":15,"r":false},' +
            '{"type":"door","x":15,"y":15,"r":false},' +
            '{"type":"engine","x":10,"y":5,"r":false},' +
            '{"type":"engine","x":10,"y":17,"r":false},' +
            '{"type":"engine","x":11,"y":11,"r":false},' +
            '{"type":"console","x":11,"y":10,"r":false},' +
            '{"type":"weapon","x":24,"y":8,"r":false},' +
            '{"type":"weapon","x":24,"y":14,"r":false},' +
            '{"type":"weapon","x":20,"y":17,"r":false},' +
            '{"type":"component","x":10,"y":7,"r":false},' +
            '{"type":"component","x":10,"y":15,"r":false},' +
            '{"type":"console","x":12,"y":5,"r":false},' +
            '{"type":"console","x":12,"y":18,"r":false},' +
            '{"type":"weapon","x":20,"y":5,"r":false},' +
            '{"type":"power","x":20,"y":15,"r":false},' +
            '{"type":"power","x":20,"y":7,"r":false},' +
            '{"type":"console","x":25,"y":10,"r":false},' +
            '{"type":"console","x":25,"y":13,"r":false},' +
            '{"type":"console","x":19,"y":18,"r":false},' +
            '{"type":"console","x":19,"y":5,"r":false},' +
            '{"type":"door","x":22,"y":11,"r":true},' +
            '{"type":"weak_spot","x":15,"y":6,"r":false},' +
            '{"type":"weak_spot","x":15,"y":16,"r":false},' +
            '{"type":"weak_spot","x":19,"y":11,"r":false},' +
            '{"type":"door","x":18,"y":11,"r":true}],' +
            '"units":[]}'}),
            Zealot = sh.units.Zealot;
        ship.putUnit(new Zealot(0, 0, {owner: params.player}));
        ship.putUnit(new Zealot(0, 0, {owner: params.player}));
        ship.putUnit(new Zealot(0, 0, {owner: params.player}));
        ship.putUnit(new Zealot(0, 0, {owner: params.player}));
        this.parent({id: params.id, ship: ship});
        this.playerLeft = params.player;
        this.playerRight = new exports.AIPlayer('Enemy');
    },
    nextTurn: function() {
        'use strict';
        this.parent();
        //register AI player orders
        this.currentTurn.addOrders(this.playerRight.getOrders(this),
            this.playerRight.id);
        this.currentTurn.setPlayerReady(this.playerRight.id);
        this.registerScriptReceived(this.playerRight.id);
    },
    generateScript: function() {
        'use strict';
        var i, clearTiles = [], summonPosition, script,
            ship = this.ship,
            damageShipActions;
        this.parent();
        script = this.currentTurn.script;
        //every 3 turns...
        if ((this.turnCount - 1) % 3 === 0) {
            //...add units for AI player
            ship.map.tiles(function(x, y) {
                if (ship.map.at(x, y) === sh.tiles.clear ||
                        ship.map.at(x, y) instanceof sh.Unit) {
                    clearTiles.push({x: x, y: y});
                }
            });
            //get random floor tile
            summonPosition = clearTiles[_.random(clearTiles.length - 1)];
            for (i = 0; i < 3; i++) {
                //noinspection JSValidateTypes
                script.insertAction(new sh.actions.Summon({
                    time: script.turnDuration - 1,
                    x: summonPosition.x,
                    y: summonPosition.y,
                    playerID: this.playerRight.id,
                    unitType: 'Critter'
                }));
            }
        }
        damageShipActions = script.byType('DamageShip');
        if (_.reduce(damageShipActions, function(memo, value) {
                return memo - value.damage;
            }, ship.hp) <= 0) {
            //ship is destroyed
            script.insertAction(new sh.actions.DeclareWinner({
                time: script.turnDuration - 10,
                playerID: this.playerRight.id
            }));
        } else if (this.turnCount >= 5) {
            //survived 15 turns!
            script.insertAction(new sh.actions.DeclareWinner({
                time: script.turnDuration - 10,
                playerID: this.playerLeft.id
            }));
        }
    }
});


/**
 * A model representing the battle set up (for the battle-set-up screen)
 * @param {{id, creator, shipJsonString}} params
 * @constructor
 */
exports.BattleSetUp = function(params) {
    'use strict';
    this.id = params.id;
    this.creator = params.creator;
    this.shipJsonString = params.shipJsonString;
    this.challenger = null; //player that joins
    this.battle = null;
    this.toJson = function() {
        return {
            id: this.id,
            battle: this.battle ?
                    this.battle.toJson() : null,
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
            ship = new sh.Ship({jsonString: this.shipJsonString});
            battle = new exports.Battle({id: battles.length, ship: ship});
            ship.putUnit({type: 6, speed: 2, owner: this.creator});
            ship.putUnit({type: 6, speed: 2, owner: this.creator});
            ship.putUnit({type: 0, speed: 1.5, owner: this.creator});
            ship.putUnit({type: 0, speed: 1.5, owner: this.creator});

            ship.putUnit({type: 7, speed: 1.5, owner: this.challenger});
            ship.putUnit({type: 7, speed: 1.5, owner: this.challenger});
            ship.putUnit({type: 12, speed: 2, owner: this.challenger});
            ship.putUnit({type: 12, speed: 2, owner: this.challenger});
            battle.playerLeft = this.creator;
            battle.playerRight = this.challenger;
            battles.push(battle);
            battle.nextTurn();
            this.battle = battle;
        } catch (e) {
            err = new Error(e);
        }
        done(err);
    };
};

//AI player stuff
(function(exports) {
    'use strict';
    var pfFinder = new sh.PF.AStarFinder({
        allowDiagonal: true
    }),
        AIPlayer;
    function getNearestWeakSpot(ship, pos) {
        var grid = new sh.PF.Grid(ship.width, ship.height, ship.getPfMatrix()),
            weakSpots = _.filter(ship.built, function(i) {
                return i instanceof sh.items.WeakSpot;
            });
        return _.min(weakSpots, function(ws) {
            return pfFinder.findPath(pos.x, pos.y, ws.x, ws.y,
                grid.clone()).length;
        });
    }

    function getUnoccupiedTile(weakSpot, units) {
        var tile = null;
        weakSpot.tiles(function(x, y) {
            if (!_.any(units, function(unit) {
                    return unit.x === x && unit.y === y;
                })) {
                tile = {x: x, y: y};
            }
        });
        return tile;
    }

    /**
     * An AI controlled player.
     * @type {*}
     */
    AIPlayer = sh.Player.extendShared({
        init: function(name) {
            this.id = -1;
            this.name = name;
        },
        /**
         * Gets the orders that the player would give for the current turn.
         * @param {exports.Battle} battle The battle.
         */
        getOrders: function(battle) {
            var ship = battle.ship,
                units = ship.getPlayerUnits(this.id),
                orders = {};
            _.each(units, function(unit) {
                if (ship.itemsMap.at(unit.x, unit.y) instanceof
                        sh.items.WeakSpot) {
                    //already at the spot, don't move
                    return;
                }
                var ws = getNearestWeakSpot(ship, unit),
                    destination = getUnoccupiedTile(ws, units);
                if (!destination) {
                    destination = ws;
                }
                orders[unit.id] = sh.make.moveOrder(unit, destination);
            });
            return orders;
        }
    });
    exports.AIPlayer = AIPlayer;
}(exports));
