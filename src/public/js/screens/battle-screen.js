/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, screens, ConnectedScreen, gs, sh, ShipFrame, ScriptPrediction,
$, utils, _, draw, ui, make, TILE_SIZE, HALF_TILE, ko, Timeline,
KeyManagerPage*/

screens.register('battle', ConnectedScreen.extend({
    currentTurnID: null,
    scriptServer: [],
    mouseDownPos: null,
    /**
     * Gets executed before onReset.
     */
    onHtmlLoaded: function() {
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

        if (this.isReset) {
            this.onResetAndLoaded();
        }
        this.htmlLoaded = true;
    },
    /**
     *
     * @param battle sh.Battle
     * @param orders Object
     */
    onReset: function(battle, orders) {
        'use strict';
        var self = this,
            framesFinished = 0;
        this.parent({id: battle.id});
        this.turnDuration = battle.turnDuration;
        gs.battle = battle;
        this.stopFetching();
        console.log('Battle id is ' + this.id);
        function frameEventHandler(e) {
            var unit, ship;
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
                        gs.battle.insertOrders(new sh.OrderCollection(e.ordersJson));
                    }
                    self.pause();
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
        this.shipFrames[0].init(600, 600);
        this.shipFrames[1].init(600, 600);
        this.keys = new KeyManagerPage(this.shipFrames);
        this.keys.bind(me.input.KEY.ESC, function() {
            console.log('PAGE ESC');
        });
        this.timeline = new Timeline(this, battle);

        this.pause();

        if (orders) {
            battle.insertOrders(orders);
        }
        //orders shown for each unit when moving the mouse around
        this.previewOrders = {};
        this.prevMouse = {x: 0, y: 0};
        if (this.htmlLoaded) {
            this.onResetAndLoaded();
        }
    },
    onDestroy: function() {
        'use strict';
        this.keys.unbindAll();
    },
    onResetAndLoaded: function() {
        'use strict';
        var screen = this;
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
                }).fail(function() {
                    console.error('Error pinging server.');
                });
            });
        }
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
    newOrders: function(unitOrdersJson) {
        'use strict';
        $.post('/battle/sendunitorders', {
            id: gs.battle.id,
            ordersJson: unitOrdersJson
        },
            function () {
                console.log('Orders successfully submitted');
            }, 'json')
            .fail(function () {
                console.error('Server error when submitting orders.');
            });
        gs.battle.addUnitOrders(new sh.UnitOrders(unitOrdersJson));
        //notify frames
        _.invoke(this.shipFrames, 'sendData', unitOrdersJson);
        this.timeline.update();
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
    }
}));
