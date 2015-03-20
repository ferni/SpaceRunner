/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, me, $, ko, socket*/

var gs = require('client/game-state'),
    utils = require('client/utils'),
    draw = require('client/draw'),
    sh = require('shared'),
    ShipFrame = require('./entities/ship-frame'),
    Timeline = require('./entities/timeline'),
    KeyManagerPage = require('./entities/key-manager-page'),
    _ = require('underscore')._;

module.exports = me.ScreenObject.extend({
    currentTurnID: null,
    scriptServer: [],
    mouseDownPos: null,
    init: function() {
        'use strict';
        this.parent(true);
    },
    /**
     *
     * @param {sh.Battle} battle
     * @param {Object} orders
     */
    onResetEvent: function(battle, orders) {
        'use strict';
        var self = this,
            framesFinished = 0;
        this.id = battle.id;
        this.turnDuration = battle.turnDuration;
        gs.battle = battle;
        this.stopFetching();
        console.log('Battle id is ' + this.id);
        function frameEventHandler(e) {
            var ship;
            if (e.eventName === 'new orders') {
                self.newOrders(e.ordersJson);
            } else if (e.eventName === 'finished playing') {
                if (self.resultingServerModel) {//not first pause
                    self.compareModelWithServer(e.battleJson);
                }
                framesFinished++;
                if (framesFinished >= self.shipFrames.length) {
                    framesFinished = 0;
                    if (self.resultingServerModel) {
                        gs.battle = new sh.Battle(self.resultingServerModel);
                        gs.battle.insertOrders(
                            new sh.OrderCollection(e.ordersJson)
                        );
                        if (gs.battle.winner !== undefined) {
                            if (gs.battle.winner === gs.player.id) {
                                self.victory();
                            } else {
                                self.defeat();
                            }
                        } else {
                            self.pause();
                        }
                    } else {
                        self.pause();
                    }
                }
            } else if (e.eventName === 'unit selected') {
                self.timeline.featuredUnit(gs.battle.getUnitByID(e.unitID));
                self.htmlVM.selectedUnit(gs.battle.getUnitByID(e.unitID));
            } else if (e.eventName === 'ship hp') {
                ship = gs.battle.getShipByID(e.targetID);
                ship.hp = e.hp;
                //refresh dom
                if (utils.isMine(ship)) {
                    self.htmlVM.myShip(ship);
                } else {
                    self.htmlVM.enemyShip(ship);
                }
            }
        }
        this.myShip = _.find(battle.ships, utils.isMine);
        this.enemyShip = _.find(battle.ships, utils.isEnemy);
        this.shipFrames = [
            new ShipFrame(battle, this.myShip, frameEventHandler),
            new ShipFrame(battle, this.enemyShip, frameEventHandler)
        ];
        this.shipFrames[0].init();
        this.shipFrames[1].init();
        this.keys = new KeyManagerPage(this.shipFrames);
        this.keys.bind(me.input.KEY.ESC, function() {
            console.log('PAGE ESC');
        });
        this.timeline = new Timeline(this, battle);
        this.prepareDom();
        this.pause();

        if (orders) {
            battle.insertOrders(orders);
        }
        //orders shown for each unit when moving the mouse around
        this.previewOrders = {};
        this.prevMouse = {x: 0, y: 0};
        socket.on('opponent surrendered', function() {
            self.victory();
        });
        socket.emit('screen:battle');
        this.startFetching();
    },
    onDestroyEvent: function() {
        'use strict';
        this.keys.unbindAll();
    },
    prepareDom: function() {
        'use strict';
        var screen = this;
        this.readyButton = (function() {
            var btn = {},
                $ready = $('#ready-button');
            btn.enabled = true;
            $ready.click(function() {
                if (btn.enabled) {
                    screen.onReady();
                }
            });
            btn.enable = function() {
                btn.enabled = true;
                $ready.removeClass('disabled')
                    .html('Ready');
            };
            btn.disable = function() {
                btn.enabled = false;
                $ready.addClass('disabled')
                    .html('Awaiting players...');
            };
            return btn;
        }());
        this.surrenderButton = (function() {
            var btn = {},
                $surrender = $('#surrender-button');
            btn.enabled = true;
            $surrender.click(function() {
                if (btn.enabled) {
                    btn.disable();
                    var sure = confirm('Are you sure you want to ' +
                        'surrender the battle?');
                    if (sure) {
                        $.post('/battle/surrender', function() {
                            screen.defeat();
                        })
                            .fail(function() {
                                console.error('Server error when trying to' +
                                    ' surrender');
                            });
                    }
                }
            });
            btn.enable = function() {
                btn.enabled = true;
                $surrender.removeClass('disabled');
            };
            btn.disable = function() {
                btn.enabled = false;
                $surrender.addClass('disabled');
            };
            return btn;
        }());
        $('html, body, #game, #screensUi, #battle-screen')
            .css({width: '100%', height: '100%'});
        //Knockout bindings
        function ViewModel() {
            this.myShip = ko.observable(screen.myShip);
            this.enemyShip = ko.observable(screen.enemyShip);
            this.selectedUnit = ko.observable(null);
            this.timeline = screen.timeline;
        }
        this.htmlVM = new ViewModel();
        ko.applyBindings(this.htmlVM, document.getElementById('screensUi'));
        $('#time-line').jScrollPane();
    },
    update: function() {
        'use strict';
        this.parent();
        if (!this.paused) {
            var elapsed = me.timer.getTime() - this.turnBeginTime;
            this.elapsed = elapsed;
            //update counter
            $('#elapsed').html(elapsed);
            if (elapsed >= this.turnDuration) {
                this.pause();
            }
        } else {
            this.keys.processBindings();
        }
    },
    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        if (this.paused) {
            if (this.dragBox) {
                this.dragBox.draw(ctx);
                utils.setCursor('crosshair');
            }
            _.invoke(this.previewOrders, 'draw', ctx);
        }
    },
    onData: function(data) {
        'use strict';
        var screen = this;
        this.currentTurnID = data.currentTurnID;
        $('#turn-number').html(this.currentTurnID);
        if (this.paused && data.scriptReady) {
            $.post('/battle/getscript', {id: screen.id}, function(data) {
                //send script to ships through postMessage
                screen.scriptServer = new sh.Script().fromJson(data.script);
                _.invoke(screen.shipFrames, 'runScript', data.script);
                screen.resultingServerModel = data.resultingServerModel;
                screen.resume();
                screen.stopFetching();
                $.post('/battle/scriptreceived', {id: screen.id}, function() {
                    //(informs the server that the script has been received)
                    return null;//for jslint
                }).fail(function() {
                    console.error('Error pinging server.');
                });
            });
        }
    },
    startFetching: function() {
        'use strict';
        var self = this;
        this.fetchIntervalID = setInterval(function() {
            $.post('/battle/get', {id: self.id}, function(data) {
                self.data = data;
                self.onData(data);
            }, 'json');
        }, 500);
    },
    stopFetching: function() {
        'use strict';
        clearInterval(this.fetchIntervalID);
    },
    newOrders: function(unitOrdersJson) {
        'use strict';
        $.post('/battle/sendunitorders', {
            id: gs.battle.id,
            ordersJson: unitOrdersJson
        },
            function() {
                console.log('Orders successfully submitted');
            }, 'json')
            .fail(function() {
                console.error('Server error when submitting orders.');
            });
        gs.battle.addUnitOrders(new sh.UnitOrders(unitOrdersJson));
        //notify frames
        _.invoke(this.shipFrames, 'sendData', unitOrdersJson);
        this.timeline.update();
    },
    canSelectedUnitRecall: function() {
        'use strict';
        var unit, recallOrder;
        unit = this.htmlVM.selectedUnit();
        if (!unit) {
            return false;
        }
        recallOrder = new sh.orders.Recall({
            unitID: unit.id
        });
        return recallOrder.isValid(gs.battle, gs.player.id);
    },
    recallUnit: function() {
        'use strict';
        var unit = this.htmlVM.selectedUnit(),
            recallOrder = new sh.orders.Recall({
                unitID: unit.id
            });
        unit.orders.push(recallOrder);
        this.newOrders(unit.makeUnitOrders().toJson());
    },
    getModelDifferenceUrl: function(aJsonString, bJsonString) {
        'use strict';
        var hashObject = {
                d: {
                    a: aJsonString,
                    b: bJsonString
                }
            };
        return 'http://tlrobinson.net/projects/javascript-fun/jsondiff/#' +
            encodeURIComponent(JSON.stringify(hashObject));
    },
    compareModelWithServer: function(battleJson) {
        'use strict';
        var clientString = JSON.stringify(battleJson),
            serverString = JSON.stringify(this.resultingServerModel);
        if (clientString === serverString) {
            console.log('Client battle model correctly matches the server' +
                ' battle model.');
        } else {
            console.error('Client battle model is different than the server' +
                ' battle model (left: client, right: server): ' +
                this.getModelDifferenceUrl(clientString, serverString));
        }
    },
    pause: function() {
        'use strict';
        $('#paused-indicator, #ready-button').show();
        $('#elapsed').hide();
        this.readyButton.enable();
        this.surrenderButton.enable();
        this.timeline.update();
        me.game.sort();
        me.game.repaint();
        this.elapsed = 0;
        console.log('--- TURN ' + this.currentTurnID + ' ---');
        this.paused = true;
    },
    resume: function() {
        'use strict';
        $('#paused-indicator, #ready-button').hide();
        $('#elapsed').show();
        //reset time
        this.turnBeginTime = me.timer.getTime();
        this.paused = false;
    },
    //When a player clicks "Ready"
    onReady: function() {
        'use strict';
        var screen = this;
        screen.readyButton.disable();
        screen.surrenderButton.disable();
        //send the orders to the server
        $.post('/battle/ready',
            {id: this.id}, function(data) {
                if (data.wasReady) {
                    console.warn('According to the server, the player ' +
                        'was already ready.');
                }
                screen.startFetching();
            }, 'json')
            .fail(function() {
                console.error('Could not ready player: server error.');
                screen.readyButton.enable();
            });
    },
    deselectUnits: function() {
        'use strict';
        _.chain(gs.selected)
            .where({name: 'unit'})
            .invoke('deselect');
    },
    showEndSign: function(message) {
        'use strict';
        $('#end-sign')
            .append('<a href="/">' + message + '</a>')
            .show();
    },
    victory: function() {
        'use strict';
        this.showEndSign('Victory!');
    },
    defeat: function() {
        'use strict';
        this.showEndSign('Defeat.');
    }
});
