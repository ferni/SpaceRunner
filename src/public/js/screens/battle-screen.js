/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, screens, ConnectedScreen, gs, sh, ShipFrame, ScriptPrediction,
ScriptPlayer, $, utils, _, draw, ui, make, TILE_SIZE, HALF_TILE, ko, Timeline*/

screens.register('battle', ConnectedScreen.extend({
    currentTurnID: null,
    scriptPlayer: null,
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
        this.parent({id: battle.id});
        this.turnDuration = battle.turnDuration;
        gs.battle = battle;
        this.stopFetching();
        console.log('Battle id is ' + this.id);
        function frameEventHandler(e) {

        }
        this.shipFrames = [
            new ShipFrame(battle, battle.ships[0].id, frameEventHandler),
            new ShipFrame(battle, battle.ships[1].id, frameEventHandler)
        ];
        this.shipFrames[0].init(100, 50, 500, 500);
        this.shipFrames[1].init(600, 50, 500, 500);
        this.scriptPlayer = new ScriptPlayer(this);
        this.timeline = new Timeline(this);
        me.input.bindKey(me.input.KEY.ESC, 'escape');
        me.input.bindKey(me.input.KEY.D, 'delete');
        me.input.registerMouseEvent('mouseup', me.game.viewport,
            this.mouseUp.bind(this));
        me.input.registerMouseEvent('mousedown', me.game.viewport,
            this.mouseDown.bind(this));
        me.input.registerMouseEvent('mousemove', me.game.viewport,
            this.mouseMove.bind(this));

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
        me.input.unbindKey(me.input.KEY.ESC);
        me.input.unbindKey(me.input.KEY.D);
        me.input.releaseMouseEvent('mouseup', me.game.viewport);
        me.input.releaseMouseEvent('mousedown', me.game.viewport);
        me.input.releaseMouseEvent('mousemove', me.game.viewport);
    },
    onResetAndLoaded: function() {
        'use strict';
        var screen = this;
        //Knockout bindings
        function ViewModel() {
            this.shipVM = function() {
                return screen.shipVM;
            };
            this.enemyHP = ko.observable(gs.battle.ships[1].hp);
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
                var script = new sh.Script().fromJson(data.script);
                screen.scriptServer = script;
                _.invoke(screen.shipFrames, 'runScript', script);
                screen.resultingModel = data.resultingModel;
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
            this.htmlVM.enemyHP(gs.battle.ships[1].hp);
            //update counter
            $('#elapsed').html(elapsed);
            if (elapsed >= this.turnDuration) {
                this.pause();
            }
        } else {
            if (me.input.isKeyPressed('delete')) {
                _.chain(gs.selected)
                    .where({name: 'order'})
                    .each(function(orderVM) {
                        orderVM.deselect();
                        orderVM.remove();
                    });
            }
            if (me.input.isKeyPressed('escape')) {
                _.invoke(gs.selected, 'deselect');
                this.previewOrders = {};
            }
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
    compareModelWithServer: function() {
        'use strict';
        var clientString = JSON.stringify(gs.battle.toJson()),
            serverString = JSON.stringify(this.resultingModel);
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
        this.scriptPlayer.onPause();
        if (this.resultingModel) {
            this.compareModelWithServer();
        }
        this.timeline.update();
        me.game.sort();
        me.game.repaint();

        _.each(me.game.getEntityByName('order'), function(oVM) {
            if (oVM.m.isValid(gs.battle, gs.player.id)) {
                oVM.updatePos();
            } else {
                oVM.remove();
            }
        });
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
    },
    updateUnitHud: function() {
        'use strict';
        var selected = _.where(gs.selected, {name: 'unit'});
        if (selected.length === 1) {
            if (this.htmlVM.selectedUnit() !== selected[0]) {
                this.htmlVM.selectedUnit(selected[0]);
            }
        } else {
            this.htmlVM.selectedUnit(null);
        }
    }
}));
