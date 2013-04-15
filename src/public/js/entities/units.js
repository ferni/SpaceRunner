/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, TileEntity*/

var Unit = TileEntity.extend({
    pendingOrders: [],
    executing: null,
    _paused: true,
    speed: 1, //tiles per second
    path:[],
    pathMaxReach: 0,
    script: [],
    init: function(x, y) {
        'use strict';
        this.parent(x, y, {image: 'unit_robot_alien'});
        this.addAnimation('idle', [0,1,2,1]);

        this.setCurrentAnimation('idle');
        this.setTransparency('000000');

    },
    pause: function(){
       this._paused = true;
    },
    resume: function(){
       this.adjustPath();
       this._paused = false;
    },
    draw: function(ctx){
       this.parent(ctx);
    },
    update: function(){
        //Assumes it's the battle screen
        var screen = me.state.current(),
            elapsed,
            position;
        if(this._paused){
            //if update doesn't return true, melonjs breaks
            return true;
        }
        this.parent();
        if(screen.name !== 'battle-screen'){
            throw 'The unit should be on the battle_screen (update).';
        }
        elapsed = screen.getElapsedTime();
        //do stuff

        position = this.getPosGivenTime(elapsed);
        this.x(position.x);
        this.y(position.y);
        return true;
    },
    /**
     *Generates a list of positions and the corresponding time
     * according to the unit's path and speed.
     *Stores the list in the "script" array.
     * @param maxTime max time in milliseconds
     */
    generateScript: function(maxTime){
        var i,
            step = this.getTimeForOneTile() * 1000,
            elapsed = 0;
        this.script = [];
        for(i = 0; i < this.path.length && elapsed <= maxTime;
            i++, elapsed += step){
            var pos = {
                x: this.path[i][0],
                y: this.path[i][1]};
            this.script.push({pos: pos, time: elapsed});
        }
        if(i > 0){
            this.pathMaxReach = i - 1;
        }else{
            this.pathMaxReach = 0;
        }

    },
    adjustPath: function(){
        this.path = _.last(this.path, this.path.length - this.pathMaxReach);
    },
    printScript: function(){
        _.each(this.script, function(frame){
            console.log(frame.time + ': ' + frame.pos.x + ', ' + frame.pos.y);
        });
    },
    getPosGivenTime: function(elapsed){
        var i,
            prevFrame,
            interpolationFactor,
            interpolationX,
            interpolationY,
            position;
        if(this.script.length === 0){
            return this.pos;
        }
        //find first frame
        for(i = 0; i < this.script.length; i++){
            if(this.script[i].time === elapsed){
                return this.script[i].pos;
            }
            if(this.script[i].time > elapsed){
                break;
            }
        }
        //surpassed script's last frame time
        if(i >= this.script.length){
            //return last position
            return this.script[this.script.length - 1].pos;
        }
        var frame = this.script[i];
        if(i > 0){
            prevFrame = this.script[i - 1];
        }
        else{
            //time elapsed it's exactly the frame time
            if(frame.time !== elapsed){
                throw 'expected time elapsed to be equal to frame time';
            }
            return frame.pos;
        }

        interpolationFactor = (elapsed - prevFrame.time) /
            (frame.time - prevFrame.time);
        interpolationX = interpolationFactor *
            (frame.pos.x - prevFrame.pos.x);
        interpolationY = interpolationFactor *
            (frame.pos.y - prevFrame.pos.y);
        position = new me.Vector2d(prevFrame.pos.x, prevFrame.pos.y);
        position.x += interpolationX;
        position.y += interpolationY;
        return position;

    },
    getTilesTraversedGivenTime: function(seconds){
        return seconds * this.speed;
    },
    //this should be divisor of TURN_DURATION
    //check that on battle screen
    getTimeForOneTile: function(){
        return 1 / this.speed;
    }
});

